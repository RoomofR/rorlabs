import { lazy } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";

import AppLayout from "./layouts/AppLayout";

const routes = [
	{
		path: "/",
		component: lazy(() => import("./pages/Home")),
	},
	{
		path: "/yan",
		component: lazy(() => import("./pages/Yan")),
	},
	{
		path: "*404",
		component: lazy(() => import("./pages/NotFound")),
	},
]

export default function App() {
	return (
		<MetaProvider>
			<Router root={AppLayout}>{routes}</Router>
		</MetaProvider>
	)
}