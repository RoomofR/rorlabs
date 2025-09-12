import { onMount, createSignal } from "solid-js";
import SiteTitle from "~/components/SiteTitle";
import styles from "./Yan.module.css";

const Yan = () => {
	let audioRef;
	const [volume, setVolume] = createSignal(0.5);

	onMount(() => {
		const playAudio = () => {
			audioRef!.play().catch(() => {});
			document.removeEventListener("click", playAudio);
		};
		document.addEventListener("click", playAudio);
	});

	const handleVolume = (e) => {
		const value = parseFloat(e.target.value);
		setVolume(value);
		if (audioRef) {
			audioRef.volume = value;
		}
	};

	return (
		<div class={styles.yanContainer}>
			<SiteTitle>Yan!</SiteTitle>
			<img class={styles.yanImage} src="/yan.gif" alt="" />
			<audio ref={audioRef} src="/FF9-Soundtrack-Fairy-Battle.mp3" autoplay loop />
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={volume()}
				onInput={handleVolume}
			/>
		</div>
	);
}

export default Yan;