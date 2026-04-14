# PhantomBot Stream Deck plugin

Stream Deck plugin based on the official [Elgato streamdeck-plugin-samples](https://github.com/elgatosf/streamdeck-plugin-samples) **hello-world** layout (`@elgato/streamdeck` SDK, Rollup, TypeScript).

Each key sends a command to PhantomBot over HTTP. The plugin adds `!` when you omit it. You authenticate with the panel token (webauth).

## Setup

1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Install the plugin folder `com.mcawful.pbstreamdeck.sdPlugin` into Stream Deck (or use `streamdeck link` from [@elgato/cli](https://www.npmjs.com/package/@elgato/cli)).

## Settings

Select a **Run command** key and open the inspector. Set **Command** for that key. Under **Bot**, set URL, token, and **Bot Twitch user** once (shared for all keys). Use **Test** to check the connection.

## Develop

`npm run watch` rebuilds on change and restarts the plugin via the Stream Deck CLI.

## Official template note

The interactive wizard `streamdeck create` is the primary official scaffold; this repo was generated from the same stack as the **hello-world** sample because the wizard is awkward to run non-interactively on Windows.

## Publish to GitHub

Quick steps after creating your GitHub repo:

1. `git add .`
2. `git commit -m "Initial commit"`
3. `git branch -M main`
4. `git remote add origin <your-repo-url>`
5. `git push -u origin main`
