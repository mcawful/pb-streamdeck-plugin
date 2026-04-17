import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "com.mcawful.pbstreamdeck.sdPlugin";

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	// Undici references optional `node:sqlite` for HTTP caching; we do not use that path.
	onwarn(warning, warn) {
		if (
			warning.code === "UNRESOLVED_IMPORT" &&
			(warning.source === "node:sqlite" || String(warning.message).includes("node:sqlite"))
		) {
			return;
		}
		warn(warning);
	},
	input: "src/plugin.ts",
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		},
	},
	plugins: [
		{
			name: "watch-externals",
			buildStart: function () {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
				this.addWatchFile(`${sdPlugin}/ui/phantomControl.html`);
			},
		},
		typescript({
			mapRoot: isWatching ? "./" : undefined,
		}),
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true,
		}),
		commonjs({
			ignore: ["node:sqlite"],
		}),
		{
			name: "emit-module-package-file",
			generateBundle() {
				this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
			},
		},
	],
};

export default config;
