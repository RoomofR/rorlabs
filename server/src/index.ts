import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from "hono/bun";

// === ROUTES ===
const app = new Hono();
app.use(cors());

// --- Test Routes ---
app.get('/hello', (c) => {
	return c.text('Hello Hono!')
});

// --- API Routes ---
app.get('/api/hello', (c) => {
	return c.json({message:"hello world"});
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