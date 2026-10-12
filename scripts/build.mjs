#!/usr/bin/env node
// Bundles the CLI into one file, dist/main.js, with every npm package inlined.
//
// The package therefore lists no runtime dependencies. Claude Code installs a
// plugin's dependencies only from an npm or Bun lockfile and flags a plugin
// that lists packages beside a pnpm lockfile, although the plugin never loads
// them: its skills call the installed `elnora-slack` CLI.

import { build } from "esbuild";

await build({
	entryPoints: ["src/main.ts"],
	outfile: "dist/main.js",
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node20",
	// CommonJS packages (axios inside @slack/web-api) call require() on Node builtins.
	banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
	logLevel: "warning",
});
