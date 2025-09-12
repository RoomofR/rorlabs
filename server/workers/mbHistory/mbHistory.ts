declare var self: Worker;

import { error } from "console";
import { Database, Statement } from "bun:sqlite";
import { Whitelisted_Item_Ids } from "./whitelist.yaml";
import {
	SaleHistoryResponseSchema, 
	type SaleHistoryResponse, 
	type SaleHistoryEntry
} from "../../schemas/SaleHistoryResponse";
const db = new Database("./database/marketboard_data.sqlite", { create: true });

//Fetches json from url and parses/returns a json object
async function fetchJSON<T>(url: string): Promise<T>{
	try{
		const res = await fetch(url);
		if(!res.ok){
			throw new Error(`Request failed: ${res.status}`);
		}
		const json = await res.json();
		return json as T;

	}catch (err){
		console.error("Fetch error:", err);
		throw err;
	}
}

type SalesOptions = {
	item_ids: Array<number>,
	server?: string, //europe/light/lich/etc
	entries?: number, //0-99999 default=1800
}

async function fetchSaleHistory({
	item_ids = [],
	server = "europe",
	entries = 1,
}: SalesOptions): Promise<SaleHistoryResponse>{
	if(item_ids.length <= 0)throw error("Empty item ids array!");
	entries = Math.max(Math.min(entries, 99999), 1);
	console.log(`Fetching History:\n- ${item_ids.join(',')}\n- From ${server} with ${entries} entries`);
	const url:string = `https://universalis.app/api/v2/history/${server}/${item_ids.join(",")}?entriesToReturn=${entries}&minSalePrice=0&maxSalePrice=2147483647`;
	const mb_history_data = await fetchJSON(url);
	return SaleHistoryResponseSchema.parse(mb_history_data);
}

//Item last updated Table
db.exec(`
	CREATE TABLE IF NOT EXISTS last_updated (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		item_id INTEGER UNIQUE NOT NULL,
		timestamp INTEGER NOT NULL,
		count INTEGER NOT NULL DEFAULT 0,
		newest INTEGER NOT NULL DEFAULT 0,
		oldest INTEGER NOT NULL DEFAULT 0
	);
`);

//Item Sale History Table
db.exec(`
	CREATE TABLE IF NOT EXISTS sale_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		item_id INTEGER NOT NULL,
		hq BOOLEAN NOT NULL,
		price_per_unit INTEGER NOT NULL,
		quantity INTEGER NOT NULL,
		timestamp INTEGER NOT NULL,
		world_id INTEGER NOT NULL,
		hash TEXT NOT NULL UNIQUE,
		aggregated BOOLEAN NOT NULL DEFAULT 0
	);
`);

function truncatedMD5(input: string, length: number = 12): string {
	const hasher = new Bun.CryptoHasher("md5");
	hasher.update(input);
	const hex = Buffer.from(hasher.digest()).toString("hex");
	return hex.slice(0, length);
}

function saleHash(item_id: number, timestamp: number, buyer_name: string, total_price: number): string {
  return truncatedMD5(`${item_id}|${timestamp}|${buyer_name}|${total_price}`);
}
// --- DB Helpers ---
const LastUploadTimeStatement: Statement = db.query(`
	INSERT INTO last_updated (item_id, timestamp)
	VALUES (?, ?)
	ON CONFLICT(item_id) DO UPDATE
		SET timestamp = excluded.timestamp
		WHERE excluded.timestamp > last_updated.timestamp
`);
const InsertSaleEntryStatement: Statement = db.prepare(`
	INSERT INTO sale_history (
		item_id,
		hq,
		price_per_unit,
		quantity,
		timestamp,
		world_id,
		hash
	) VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(hash) DO NOTHING
`);
const InsertManyTransaction = db.transaction((entries: {
		item_id: number,
		hq: boolean,
		pricePerUnit: number,
		quantity: number,
		timestamp: number,
		worldID: number,
		hash: string
	}[]) => {
		let inserted = 0;
		for (const e of entries) {
			const result = InsertSaleEntryStatement.run(
				e.item_id,
				e.hq ? 1 : 0,
				e.pricePerUnit,
				e.quantity,
				e.timestamp,
				e.worldID,
				e.hash
			);
			inserted += result.changes;
		}
		return inserted;
});

// --- Logic Helpers ---
async function findItemsNeedingUpdate(whitelist: number[]): Promise<number[]> {
	const singleHistoryFetch = await fetchSaleHistory({
		item_ids: whitelist,
		entries: 1
	});

	let itemsToUpdate: number[] = [];

	for (let item_id of whitelist) {
		const entry = singleHistoryFetch.items[item_id];
		const lastUploadTime: number = entry?.lastUploadTime || 0;

		const db_result = LastUploadTimeStatement.run(item_id, lastUploadTime);
		const hasUpdate = db_result.changes > 0;

		console.log(item_id, new Date(lastUploadTime).toISOString(), hasUpdate);

		if (hasUpdate) {
			itemsToUpdate.push(item_id);
		}
	}

	return itemsToUpdate;
}

function formatSaleEntries(item_id: number, saleEntries: SaleHistoryEntry[]) {
	return saleEntries.map(sale => ({
		item_id,
		hq: sale.hq,
		pricePerUnit: sale.pricePerUnit,
		quantity: sale.quantity,
		timestamp: sale.timestamp,
		worldID: sale.worldID,
		hash: saleHash(
			item_id,
			sale.timestamp,
			sale.buyerName,
			sale.pricePerUnit * sale.quantity
		)
	}));
}

interface MarketSummaryRow {
  item_id: number;
  count: number;
  oldest: number;
  newest: number;
}

function updateMarketBoardStatus(){
	const market_summary = db.prepare(`
	SELECT 
		item_id,
		COUNT(*) AS count,
		MIN(timestamp) AS oldest,
		MAX(timestamp) AS newest
	FROM sale_history
	GROUP BY item_id
	`).all() as MarketSummaryRow[];

	db.transaction(() => {
	for (const row of market_summary) {
		db.run(
		`
		INSERT INTO last_updated (item_id, count, oldest, newest)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(item_id) DO UPDATE SET
			count = excluded.count,
			oldest = excluded.oldest,
			newest = excluded.newest
		`,
			[
				row.item_id,
				row.count,
				row.oldest,
				row.newest
			]
		);
	}
	})();
}

//--- Main ---
async function checkAndUpdateMBData(){
	//Check for which items to update by getting only 1 query from history
	const itemsToUpdate: number[] = await findItemsNeedingUpdate(Whitelisted_Item_Ids);

	if (itemsToUpdate.length === 0) {
		console.log("No updates needed.");
		return;
	}

	//Get full history of items that need updating, and insert them into sale_history table
	const multiHistoryFetch = await fetchSaleHistory({
		item_ids: itemsToUpdate,
		entries: 99999
	});

	let total_insertions: number = 0;
	for (let item_id of itemsToUpdate) {
		const itemEntry = multiHistoryFetch.items[item_id];
		if (!itemEntry) throw new Error(`No entry found for item ${item_id}`);

		const formattedEntries = formatSaleEntries(item_id, itemEntry.entries);
		const insertedCount = InsertManyTransaction(formattedEntries);

		console.log(`Inserted ${insertedCount} entries for item ${item_id}`);
		total_insertions += insertedCount;
	}
	console.log(`${total_insertions} total entries added to sale history database`);

	//Update the stats on last_updated
	updateMarketBoardStatus();
}

function msUntilNextHour() {
  const now = new Date();
  return (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1000 - now.getMilliseconds();
}

function runHourlyTask(task: () => void) {
	task();
	const delay = msUntilNextHour();
	setTimeout(async () => {
		try {
			task(); // run at the top of the hour
		} catch (err) {
			console.error("Hourly task error:", err);
		}

		setInterval(async () => {
			try {
				task();
			} catch (err) {
				console.error("Hourly task error:", err);
			}
		}, 60 * 60 * 1000); // repeat every hour
	}, delay);
}

runHourlyTask(()=>{
	checkAndUpdateMBData();
	postMessage("update");
})