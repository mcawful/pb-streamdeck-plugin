# PhantomBot Stream Deck plugin

Stream Deck plugin based on the official [Elgato streamdeck-plugin-samples](https://github.com/elgatosf/streamdeck-plugin-samples) **hello-world** layout (`@elgato/streamdeck` SDK, Rollup, TypeScript).

Each key sends an authenticated **HTTP PUT** to PhantomBot’s `HTTPAuthenticatedHandler` (for example `/dbquery`) with `user` and `message` headers. The plugin adds a leading `!` to the command when needed so PhantomBot treats it as a chat command. Auth uses the panel **webauth** token only (HTTP header `webauth`).

## Setup

1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Install the plugin folder `com.mcawful.pbstreamdeck.sdPlugin` into Stream Deck (or use `streamdeck link` from [@elgato/cli](https://www.npmjs.com/package/@elgato/cli)).

## Settings

Select a **Run command** key, then use the property inspector on the right. The inspector lists **this button’s command** first, then **shared server fields** (Stream Deck global settings: URL, webauth, run-as user, optional self-signed HTTPS). `!` on the command is optional; the plugin adds it when sending.

The Node plugin uses `streamDeck.settings.getGlobalSettings()` for connection data and each key’s action settings for `command`.

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
