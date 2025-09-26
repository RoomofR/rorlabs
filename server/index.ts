import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from "hono/bun";
import { proxy } from "hono/proxy";

import startAllWorkers from "./workers";
startAllWorkers();

// === ROUTES ===
const app = new Hono();
app.use(cors());

// --- Test Routes ---
app.get('/hello', (c) => {
	return c.text('Hello Hono!')
});

// --- API Routes ---
import apiRoutes from "./routes/api"; 
app.route("/api", apiRoutes);

app.get('/api', (c) => {
	return c.json({message:"hello world"});
});

// --- Silver Bullet Docker App ---
app.all("/sb/*", (c) => {
	const originalPath = c.req.url.replace(/^\/sb/, "");
	const target = `http://localhost:1950${originalPath}`;

	return proxy(target, {
		raw: c.req.raw,
		headers: {
			...c.req.header(),
			"X-Forwarded-Host": c.req.header("host"),
			"X-Forwarded-For": c.req.header("x-forwarded-for") ?? c.req.header("host"),
		}
	});
});

// --- Static Files (client build) ---
app.use("/*", serveStatic({ root: "../client/dist" }));
app.get("*", serveStatic({ root: "../client/dist", path: "index.html" }));

// === SERVER & AUTH ===
//Serve the server with its routes and tls if needed.
const ENV: string = process.env.BUILD || "DEV";
const PORT: number = ENV === "PROD" ? 443 : Number(process.env.PORT);

const server = Bun.serve({
	port: PORT,
	fetch: app.fetch,
	tls: ENV === "PROD"
		? {
			key: Bun.file(process.env.TLS_KEY_PATH!),
    		cert: Bun.file(process.env.TLS_CERT_PATH!)
		}
		: undefined,
});

console.log(`Started ${ENV === "PROD"?"production":"development"} server: https://${server.hostname}:${server.port}`);