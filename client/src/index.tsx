/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
/* import App from './App'; */

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
	throw new Error(
		'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
	);
}

import { Router, Route } from "@solidjs/router";

const App = (props: any) => (
	<>
		<h1>Test Site</h1>
		{props.children}
	</>
);

const Home = () => (
	<h2>Hello world!</h2>
);

const Test = () => (
	<h2>Another test page!</h2>
);

import yanGif from "./assets/yan.gif";
import yanSong from "./assets/FF9-Soundtrack-Fairy-Battle.mp3";
import { onMount, createSignal } from "solid-js";
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
		<div style={{ display: "flex", justifyContent: "middle" }}>
			<img class="yan" src={yanGif} alt="" />
			<audio ref={audioRef} src={yanSong} autoplay loop />
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


render(
	() => 
		<Router root={App}>
			<Route path="/" component={Home} />
			<Route path="/test" component={Test} />
			<Route path="/yan" component={Yan} />
		</Router>,
	document.getElementById('root')!
);