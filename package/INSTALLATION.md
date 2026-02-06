# Recall Knowledge Module - Installation Guide

## Package Contents

This package contains a compiled, ready-to-install FoundryVTT module with the following structure:

```
recall-knowledge/
├── module.json                 # Module manifest
├── README.md                  # Documentation
├── CHANGELOG.md              # Version history
├── LICENSE                   # License file
├── scripts/
│   └── recall-knowledge.js   # Main module script
├── styles/
│   └── recall-knowledge.css  # Module styles
├── lang/
│   └── en.json              # English localization
└── macros/
    └── recall-knowledge.js   # Player macro
```

## Installation Instructions

### Method 1: Manual Installation
1. Copy the entire `recall-knowledge` folder to your FoundryVTT `Data/modules/` directory
2. The final path should be: `[Foundry Data]/modules/recall-knowledge/`
3. Restart FoundryVTT
4. In your world, go to **Game Settings** → **Manage Modules**
5. Find "Recall Knowledge" in the list and enable it
6. Save changes and reload the world

### Method 2: Module Installation (if you have a zip file)
1. In FoundryVTT, go to **Game Settings** → **Manage Modules**
2. Click **Install Module**
3. Choose **Browse Files** and select the recall-knowledge.zip file
4. Click **Install**
5. Enable the module and reload

## Setup and Configuration

### 1. Module Settings
After installation, configure the module in **Game Settings** → **Module Settings**:

- **Require GM Approval**: Enable GM approval for all recall knowledge attempts
- **Auto-Calculate DC**: Automatically calculate DCs based on creature level
- **Revealable Information**: Configure what information can be revealed

### 2. Import the Macro
1. Go to the **Macro Directory** in FoundryVTT
2. Click **Create Macro**
3. Set Type to **Script**
4. Copy the contents from `macros/recall-knowledge.js` into the macro
5. Name it "Recall Knowledge"
6. Save and assign to hotbar

### 3. Player Usage
1. Target a creature token
2. Click the "Recall Knowledge" macro button
3. If GM approval is enabled, wait for GM to approve and select skill
4. View the results in chat

### 4. GM Usage
- When players request recall knowledge, you'll see an approval dialog
- Select which skill the player should use
- Optionally set a custom DC
- Choose what information to reveal based on success level

## Features

✅ **GM-Approved Workflow**: Players request, GMs approve and select skills
✅ **Knowledge Skills**: Supports Arcana, History, Nature, Religion, and Lore skills
✅ **Dynamic DC Calculation**: Automatic DC based on creature level
✅ **Information Revelation**: Configurable information display based on success levels
✅ **Real-time Communication**: Socket-based multiplayer support
✅ **Comprehensive Settings**: Full configuration options for GMs

## Troubleshooting

### Module Not Loading
- Ensure the folder structure is correct
- Check the browser console (F12) for JavaScript errors
- Verify FoundryVTT version compatibility (v13+)

### Socket Issues
- Ensure the module is enabled for all players
- Check that socket communication is working in your world

### Macro Not Working
- Verify you have a character selected
- Ensure you have a creature targeted
- Check that the module is properly initialized (look for "Recall Knowledge module loaded" in console)

## Support

For issues, feature requests, or contributions, please refer to the project repository or contact the module developer.

## Compatibility

- **FoundryVTT Version**: 13+
- **Game Systems**: Designed for Pathfinder 2e, adaptable to other systems
- **Dependencies**: None (uses core FoundryVTT functionality)

---

*This module provides enhanced recall knowledge mechanics for tabletop RPG sessions in FoundryVTT.*