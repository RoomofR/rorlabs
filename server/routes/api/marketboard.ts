import Database from "bun:sqlite";
import type { Context } from "hono";

export default function api(c: Context){
	const db = new Database("./database/marketboard_data.sqlite", { readonly: true });
	
	const rows = db.prepare("SELECT * FROM last_updated ORDER BY item_id ASC").all();

	return c.json(rows);
}