import FooterBar from "~/components/FooterBar";

import styles from "./AppLayout.module.css";

export default function AppLayout(props: any){
	return (
		<>
			<div class={styles.content}>
				{props.children}
			</div>
			<FooterBar/>
		</>
	);
}