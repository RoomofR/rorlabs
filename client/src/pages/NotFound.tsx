import styles from "./NotFound.module.css";
import SiteTitle from "~/components/SiteTitle";

export default function NotFound(props: any){
	return (
		<div class={styles.container}>
			<SiteTitle>404 Not Found</SiteTitle>
			<div class={styles.wrapper}>
				<div class={styles.title}>404 Not Found</div>
				<img class={styles.image} src="/sad_cat.jpg" />
				<div class={styles.subtext}>Sorry the cat it ate all...</div>
			</div>
		</div>
	);
}