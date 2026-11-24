# Arcade integration

This repository is a source patch for Microsoft MakeCode PXT Arcade.

The helper package is in `source/libs/modsmakecode/`.

Add these package entries to the target's `pxtarget.json` `bundleddirs` list:

```json
"libs/modsmakecode",
```

Make the package available to default projects by registering it as a dependency of the target's hidden `game` package:

```json
{
  "additionalFilePath": "../../node_modules/pxt-common-packages/libs/game",
  "hidden": true,
  "dependencies": {
    "modsmakecode": "file:../modsmakecode"
  }
}
```

The package requires no helper-specific dependency beyond the normal Arcade `device` package.
