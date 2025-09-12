import { For, Show, createResource } from "solid-js";

async function fetchMarketboard() {
	const res = await fetch("/api/marketboard");
	if (!res.ok) throw new Error("Failed to fetch marketboard");
	return res.json();
}

export default function Marketboard(){
	const [data] = createResource(fetchMarketboard);

	return (
		<div>
			<h2>Marketboard Data</h2>
			<Show when={data()} fallback={<p>Loading...</p>}>
				<table style={{ borderCollapse: "collapse", width: "100%" }}>
					<thead>
						<tr>
							<th>ID</th>
							<th>Item ID</th>
							<th>Last Updated</th>
							<th>Count</th>
							<th>Newest</th>
							<th>Oldest</th>
						</tr>
					</thead>
					<tbody>
						<For each={data()}>
							{(item) => (
								<tr>
									<td>{item.id}</td>
									<td>{item.item_id}</td>
									<td>{new Date(item.timestamp * 1000).toLocaleString()}</td>
									<td>{item.count}</td>
									<td>{new Date(item.newest * 1000).toLocaleString()}</td>
									<td>{new Date(item.oldest * 1000).toLocaleString()}</td>
								</tr>
							)}
						</For>
					</tbody>
				</table>
			</Show>
		</div>
	)
}

	