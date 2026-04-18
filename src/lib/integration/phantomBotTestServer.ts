/**
 * Minimal local HTTP(S) server that mimics PhantomBot panel routes used by {@link ../phantomBot}.
 *
 * @module
 */
import fs from "node:fs";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import https from "node:https";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PhantomBotLikeServer = {
	baseUrl: string;
	expectedWebauth: string;
	/** Last `PUT /dbquery` request headers (after the request body has been consumed). */
	getLastDbQueryHeaders: () => Record<string, string | undefined> | undefined;
	close: () => Promise<void>;
};

type ServerOptions = {
	expectedWebauth?: string;
	dbQueryStatus?: number;
	dbQueryBody?: string;
	gamesStatus?: number;
	gamesBody?: string;
};

async function drainRequestBody(req: IncomingMessage): Promise<void> {
	for await (const _chunk of req) {
		/* discard */
	}
}

function pickHeader(req: IncomingMessage, name: string): string | undefined {
	const v = req.headers[name];
	if (v === undefined) return undefined;
	return Array.isArray(v) ? v[0] : v;
}

function createPhantomBotListener(
	expectedWebauth: string,
	dbQueryStatus: number,
	dbQueryBody: string,
	gamesStatus: number,
	gamesBody: string,
	state: { lastDbQueryHeaders?: Record<string, string | undefined> },
): (req: IncomingMessage, res: ServerResponse) => void {
	return (req, res) => {
		void (async () => {
			try {
				const webauth = req.headers["webauth"];
				const okAuth = webauth === expectedWebauth;

				if (req.method === "PUT" && req.url === "/dbquery") {
					await drainRequestBody(req);
					state.lastDbQueryHeaders = {
						user: pickHeader(req, "user"),
						message: pickHeader(req, "message"),
						webauth: pickHeader(req, "webauth"),
					};
					if (!okAuth) {
						res.writeHead(401, { "Content-Type": "text/plain" }).end("unauthorized");
						return;
					}
					res.writeHead(dbQueryStatus, { "Content-Type": "text/plain" }).end(dbQueryBody);
					return;
				}

				if (req.method === "GET" && req.url?.startsWith("/games?")) {
					await drainRequestBody(req);
					if (!okAuth) {
						res.writeHead(401, { "Content-Type": "application/json" }).end("{}");
						return;
					}
					res.writeHead(gamesStatus, { "Content-Type": "application/json" }).end(gamesBody);
					return;
				}

				res.writeHead(404).end();
			} catch {
				res.writeHead(500).end();
			}
		})().catch(() => {
			if (!res.writableEnded) res.writeHead(500).end();
		});
	};
}

function listen(server: http.Server | https.Server): Promise<{ address: AddressInfo }> {
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const addr = server.address() as AddressInfo;
			resolve({ address: addr });
		});
	});
}

/**
 * Listens on an ephemeral port on `127.0.0.1` and serves `PUT /dbquery` and `GET /games` over **HTTP**.
 */
export async function startPhantomBotLikeHttpServer(options: ServerOptions): Promise<PhantomBotLikeServer> {
	const expectedWebauth = options.expectedWebauth ?? "integration-webauth";
	const dbQueryStatus = options.dbQueryStatus ?? 200;
	const dbQueryBody = options.dbQueryBody ?? "ok";
	const gamesStatus = options.gamesStatus ?? 200;
	const gamesBody = options.gamesBody ?? "[]";

	const state: { lastDbQueryHeaders?: Record<string, string | undefined> } = {};
	const server = http.createServer(
		createPhantomBotListener(expectedWebauth, dbQueryStatus, dbQueryBody, gamesStatus, gamesBody, state),
	);

	const { address } = await listen(server);
	const baseUrl = `http://127.0.0.1:${address.port}`;

	return {
		baseUrl,
		expectedWebauth,
		getLastDbQueryHeaders: () => state.lastDbQueryHeaders,
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close((err) => (err ? reject(err) : resolve()));
			}),
	};
}

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

/**
 * Same routes as {@link startPhantomBotLikeHttpServer}, over **HTTPS** with a **self-signed**
 * certificate (CN and SAN `127.0.0.1`). Use with {@link ../phantomBot} `allowInsecureTls: true`, like
 * many PhantomBot panels with default certs.
 */
export async function startPhantomBotLikeHttpsServer(options: ServerOptions): Promise<PhantomBotLikeServer> {
	const expectedWebauth = options.expectedWebauth ?? "integration-webauth";
	const dbQueryStatus = options.dbQueryStatus ?? 200;
	const dbQueryBody = options.dbQueryBody ?? "ok";
	const gamesStatus = options.gamesStatus ?? 200;
	const gamesBody = options.gamesBody ?? "[]";

	const state: { lastDbQueryHeaders?: Record<string, string | undefined> } = {};
	const server = https.createServer(
		{
			key: fs.readFileSync(path.join(fixtureDir, "test-key.pem")),
			cert: fs.readFileSync(path.join(fixtureDir, "test-cert.pem")),
		},
		createPhantomBotListener(expectedWebauth, dbQueryStatus, dbQueryBody, gamesStatus, gamesBody, state),
	);

	const { address } = await listen(server);
	const baseUrl = `https://127.0.0.1:${address.port}`;

	return {
		baseUrl,
		expectedWebauth,
		getLastDbQueryHeaders: () => state.lastDbQueryHeaders,
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close((err) => (err ? reject(err) : resolve()));
			}),
	};
}
