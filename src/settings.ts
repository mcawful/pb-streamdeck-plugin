/**
 * Shared Stream Deck plugin settings types (global vs per-action).
 *
 * @module
 */

/**
 * Plugin-wide settings (Stream Deck global settings). Persisted once for the plugin, not per key.
 */
export type PluginGlobalSettings = {
	baseUrl?: string;
	/** PhantomBot panel webauth token (HTTP header `webauth`). */
	webauth?: string;
	/** Twitch/channel name PhantomBot uses for command permission checks (HTTP header `user`). */
	phantomUser?: string;
	/**
	 * When true, HTTPS requests skip TLS certificate verification (`rejectUnauthorized: false`).
	 * Use for self-signed certs, local dev, or broken chains; does not affect `http://` URLs.
	 */
	allowInsecureTls?: boolean;
};

/**
 * Per-key settings: only the command to run.
 */
export type PhantomCommandActionSettings = {
	command?: string;
};
