# PhantomBot Command (Stream Deck)

Third-party Stream Deck plugin that sends **PhantomBot chat commands** over the bot’s authenticated HTTP API. Configure your bot once, assign a command per key, press to run.

> **Not official PhantomBot software.** This project is independent: it is not affiliated with, endorsed by, or supported by the [PhantomBot](https://github.com/PhantomBot/PhantomBot) project. Author: **McAwful**.

## Features

- **Per-key command** — Each button stores its own command text; the plugin adds a leading `!` if you omit it (PhantomBot treats `!` as a chat command).
- **Shared bot settings** — Bot URL, panel webauth token, and Twitch username are saved once as plugin global settings (same for every key).
- **Test** — Check URL and token from the property inspector before relying on keys.
- **HTTPS options** — Optional “don’t verify HTTPS certificates” for self-signed or local dev TLS, with in-app warnings when enabled.
- **Key title** — The label on the device is whatever you set in Stream Deck’s **Title** field; it is not copied from the command text.

## Requirements

- **Stream Deck** app **6.5** or newer (see `manifest.json` → `Software.MinimumVersion`).
- **Node.js 20** — Used by Stream Deck to run this plugin at runtime (see `manifest.json` → `Nodejs`).
- **PhantomBot** with HTTP/panel access and a valid **webauth** token (from your bot panel / `botlogin.txt`, depending on your setup).

## Install (from source)

1. Clone this repository.
2. Install dependencies: `npm install`
3. Build: `npm run build`  
   Output is written into `com.mcawful.pbstreamdeck.sdPlugin/bin/plugin.js`.
4. Register the plugin with Stream Deck, for example:
    - **`streamdeck link`** from [@elgato/cli](https://www.npmjs.com/package/@elgato/cli) pointed at `com.mcawful.pbstreamdeck.sdPlugin`, or
    - Copy the entire `com.mcawful.pbstreamdeck.sdPlugin` folder into Stream Deck’s plugins directory (platform-specific).

Restart Stream Deck or run `streamdeck restart com.mcawful.pbstreamdeck` after updating.

## Configure

1. Add the **Run command** action from the **PhantomBot** category.
2. Open the property inspector for that key.
3. Under **Command**, enter the chat command (with or without `!`).
4. Expand **Bot connection configuration** and set:
    - **Bot URL** — Base URL of your PhantomBot HTTP endpoint (no trailing slash required).
    - **Bot webauth token** — Panel webauth token used in the `webauth` header.
    - **Bot Twitch username** — Value sent as the `user` header (who the command runs as for PhantomBot).
5. Use **Test** to confirm the bot answers. If HTTPS fails because of certificate trust, enable **Don’t verify HTTPS certificates** only when you understand the risk (see the in-app warning).
6. In the Stream Deck canvas, set the key **Title** to whatever you want shown on the device.

## How it talks to PhantomBot

On key press, the plugin sends an authenticated **`PUT`** to `{baseUrl}/dbquery` with headers `user`, `message`, and `webauth`. The connection test uses a lightweight authenticated **`GET`** to `{baseUrl}/games?search=…`. Behavior matches PhantomBot’s HTTP handler expectations; see the PhantomBot source for details.

## Development

| Command             | Purpose                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `npm run build`     | Production bundle into `com.mcawful.pbstreamdeck.sdPlugin/bin/`                          |
| `npm run watch`     | Rebuild on change and restart the plugin (`streamdeck restart com.mcawful.pbstreamdeck`) |
| `npm run typecheck` | `tsc --noEmit`                                                                           |

Optional: validate the plugin package with [Stream Deck CLI](https://docs.elgato.com/streamdeck/cli/commands/validate) `streamdeck validate com.mcawful.pbstreamdeck.sdPlugin`.

Stack: [Elgato `@elgato/streamdeck`](https://www.npmjs.com/package/@elgato/streamdeck) SDK, TypeScript, Rollup, [Undici](https://github.com/nodejs/undici) for HTTP. The property inspector uses [sdpi-components](https://sdpi-components.dev/) (loaded from CDN in `phantomCommand.html`).

## Layout

```
com.mcawful.pbstreamdeck.sdPlugin/   # Plugin bundle (manifest, UI, icons, compiled JS)
src/
  plugin.ts                          # Registers actions, connection test handler
  actions/phantomCommand.ts          # Key press → HTTP request
  lib/phantomBot.ts                  # PhantomBot HTTP helpers
  lib/toBool.ts                      # Shared boolean coercion for settings
  lib/streamDeckConnection.ts        # Low-level reply path to the property inspector
```

## Links

- **This repo:** [github.com/mcawful/pb-streamdeck-plugin](https://github.com/mcawful/pb-streamdeck-plugin) — [Issues](https://github.com/mcawful/pb-streamdeck-plugin/issues)
- **PhantomBot (upstream):** [github.com/PhantomBot/PhantomBot](https://github.com/PhantomBot/PhantomBot)

## License

[MIT](LICENSE) — Copyright (c) 2026 McAwful
