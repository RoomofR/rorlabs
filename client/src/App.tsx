import { lazy } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";

import AppLayout from "./layouts/AppLayout";

export default function App() {
	return (
		<MetaProvider>
			<Router root={AppLayout}>
				<Route path="/" component={lazy(() => import("./pages/Home"))}/>
				<Route path="/yan" component={lazy(() => import("./pages/Yan"))}/>
				<Route path="/mb" component={lazy(() => import("./pages/Marketboard"))}/>
				<Route path="/mb/:id" component={lazy(() => import("./pages/MarketboardItem"))}/>
				<Route path="*404" component={lazy(() => import("./pages/NotFound"))}/>
			</Router>
		</MetaProvider>
	)
}