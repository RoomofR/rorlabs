import { useParams } from "@solidjs/router";
export default function MarketboardItem(){
	const params = useParams();
	console.log(params.id);

	return (
		<>
			<h1>{params.id}</h1>
		</>
	)
}