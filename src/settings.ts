/**
 * Plugin-wide settings (Stream Deck global settings). Persisted for the plugin; not duplicated on each key.
 */
export type PluginGlobalSettings = {
	baseUrl?: string;
	/** PhantomBot panel webauth token (HTTP header `webauth`). */
	webauth?: string;
	/** Twitch/channel name PhantomBot uses for command permission checks (HTTP header `user`). */
	phantomUser?: string;
	allowInsecureTls?: boolean;
};

/**
 * Per-key settings: only the command to run.
 */
export type PhantomCommandActionSettings = {
	command?: string;
};
