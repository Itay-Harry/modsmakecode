# ModsMakeCode

ModsMakeCode uses the Microsoft MakeCode PXT and MakeCode Arcade sources in this workspace. It does not replace or emulate PXT blocks.

## Run the local editor

From `pxt-arcade`:

```bat
npm run serve -- --rebundle --noauth
```

Open the URL printed by PXT (normally `http://localhost:3232/`).

## Generate the block catalog

```bat
node tools\generate-block-catalog.js
```

The source-derived catalog is written to:

- `docs/block-catalog.json`
- `docs/block-catalog.md`

The catalog reads PXT block annotations and API declarations from resolved Arcade and common-package sources. It does not depend only on `block=` text.

## Mods helper blocks

`pxt-arcade/libs/modsmakecode` contains clearly named Mods blocks for checkpoints, health bars, enemy waves, inventory, dialogue choices, and movement. They are registered as a separate visible toolbox category while preserving the default Arcade blocks.

Compile the helper test project from `pxt-arcade/tests/modsmakecode`:

```bat
node ..\..\node_modules\pxt-core\built\pxt.js build
```
