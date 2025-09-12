export default function startMBHistoryWorker(){
	const worker = new Worker("./workers/mbHistory/mbHistory.ts");
	let count = 0;
	worker.onmessage = event => {
		count++;
		console.log(`MBHistoryWorker [${count}]: ${event.data}`);
	};
}