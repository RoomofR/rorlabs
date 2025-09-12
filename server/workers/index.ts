import startMBHistoryWorker from "./mbHistory";
const Workers = [
	{
		"enabled": true,
		"worker": startMBHistoryWorker
	}
];

export default function startAllWorkers(){
	for(let workerInstance of Workers){
		if(workerInstance.enabled){
			workerInstance.worker();
		}
	}
}