# Recall Knowledge Module - Installation Guide

## Package Contents

This package contains a compiled, ready-to-install FoundryVTT module with the following structure:
```
recall-knowledge/
├── module.json                 # Module manifest
├── README.md                   # Documentation
├── CHANGELOG.md                # Version history
├── LICENSE                     # License file
├── scripts/
│   └── recall-knowledge.js     # Main module script
├── styles/
│   └── recall-knowledge.css    # Module styles
├── lang/
│   └── en.json                 # English localization
└── macros/
    └── recall-knowledge.js     # Player macro
```

## Installation Instructions

### Method 1: Manual Installation
1. Copy the entire `recall-knowledge` folder to your FoundryVTT `Data/modules/` directory.
2. The final path should be: `[Foundry Data]/modules/recall-knowledge/`
3. Restart FoundryVTT.
4. In your world, go to **Game Settings** → **Manage Modules**.
5. Find "Recall Knowledge" in the list and enable it.
6. Save changes and reload the world.

### Method 2: Module Installation (zip)
1. In FoundryVTT, go to **Game Settings** → **Manage Modules**.
2. Click **Install Module**.
3. Choose **Browse Files** (or paste the manifest URL) and select the recall-knowledge zip file.
4. Click **Install**.
5. Enable the module and reload.

## Setup and Configuration

### Module Settings
After installation, configure the module in **Game Settings** → **Module Settings**:
- **Require GM Approval**: Require GM approval for recall knowledge requests.
- **Auto-Calculate DC**: Automatically calculate DCs based on creature level.
- **Revealable Information**: Configure what information can be revealed.

### Import the Macro
1. Go to the **Macro Directory** in FoundryVTT.
2. Click **Create Macro**.
3. Set Type to **Script**.
4. Copy the contents from `macros/recall-knowledge.js` into the macro.
5. Name it "Recall Knowledge".
6. Save and assign it to a hotbar slot.

### Player Workflow
1. Target a creature token.
2. Activate the "Recall Knowledge" macro.
3. If GM approval is enabled, wait for approval and skill selection.
4. View the results in chat.

### GM Workflow
- Approve or reject recall knowledge requests.
- Select which skill the player should roll.
- Optionally override the DC.
- Decide which information to reveal based on success level.

## Features

- ✅ **GM-Approved Workflow**: Players request, GMs approve and oversee.
- ✅ **Knowledge Skills Support**: Arcana, Nature, Religion, Society, Lore, and more.
- ✅ **Dynamic DC Calculation**: Automatically scales with creature level.
- ✅ **Information Revelation**: Configurable info by success level.
- ✅ **Socket Support**: Multiplayer synchronization.
- ✅ **Comprehensive Settings**: Fine-grained module controls.

## Troubleshooting

### Module Not Loading
- Ensure the folder structure is correct.
- Check the browser console (F12) for JavaScript errors.
- Verify FoundryVTT version compatibility (v13+).

### Socket Issues
- Ensure the module is enabled for all players.
- Check that socket communication is working in your world.

### Macro Not Working
- Verify you have a character selected.
- Ensure you have targeted a creature.
- Confirm the module has initialized (look for "Recall Knowledge module loaded" in the console).

## Support

For issues, feature requests, or contributions, visit the project repository.

## Compatibility

- **FoundryVTT Version**: 13+
- **Primary System**: Pathfinder 2e (PF2e)
- **Dependencies**: None (uses core FoundryVTT functionality)

---

*This module enhances recall knowledge mechanics for FoundryVTT.*
