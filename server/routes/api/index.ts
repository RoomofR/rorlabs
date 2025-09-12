import { Hono } from "hono";
const router = new Hono();

import Marketboard from "./marketboard";

router.get("/marketboard", (c) => Marketboard(c));

router.get('/hello', (c) => {
	return c.json({message:"hello world"});
});

router.get('*', (c) => {
	return c.json([
		{
			endpoint:"/marketboard",
			description:"returns entire marketboard db status and contents"
		},
		{
			endpoint:"/hello",
			description:"just a simple hello world endpoint test"
		},
	]);
});

export default router;