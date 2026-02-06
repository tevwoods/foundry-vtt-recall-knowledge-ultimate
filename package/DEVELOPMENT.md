# Development and Installation Guide

## Quick Start

### Development Setup

1. **Prerequisites**
   - FoundryVTT v13+ installed
   - Node.js 18+ (optional for building from source)
   - Git (optional for version control)

2. **Installation in FoundryVTT**
   ```
   1. Copy the entire 'recall-knowledge' folder to your FoundryVTT modules directory:
      - Windows: %LOCALAPPDATA%\FoundryVTT\Data\modules\
      - macOS: ~/Library/Application Support/FoundryVTT/Data/modules/
      - Linux: ~/.local/share/FoundryVTT/Data/modules/
   
   2. Start or restart FoundryVTT
   
   3. Create or load a world
   
   4. Go to Game Settings → Manage Modules
   
   5. Enable "Recall Knowledge" module
   
   6. Save and reload the world
   ```

3. **Verify Installation**
   - Check the browser console for initialization messages
   - Look for "Recall Knowledge | Module initialized successfully"
   - Access module settings in Configure Settings → Module Settings

## Development Workflow

### Building the Module

If you have Node.js installed:

```bash
# Install dependencies (optional - module works without building)
npm install

# Build for production
npm run build

# Development with watching
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

### Development Mode

1. **Enable Debug Mode**
   - Go to Configure Settings → Module Settings
   - Enable "Debug Mode"
   - Check browser console for detailed logging

2. **Hot Reload Development**
   - Use `npm run dev` to watch for file changes
   - Refresh your browser (F5) to see changes
   - Module will automatically reinitialize

### Debugging

#### Browser Console Debugging
```javascript
// Access the module API
const api = game.RecallKnowledge;

// Check if module is loaded
console.log('Module loaded:', !!api);

// Test rule creation
const rule = api.rules.createKnowledgeRule({
  key: 'test.knowledge',
  label: 'Test Knowledge Check',
  type: 'arcana',
  dc: 15
});

// Add the rule
api.rules.addRuleElement(rule);

// Test knowledge check
api.knowledge.performCheck(game.actors.contents[0], 'arcana')
  .then(result => console.log('Knowledge check result:', result));
```

#### VS Code Debugging
1. Install recommended extensions
2. Use VS Code tasks: `Ctrl+Shift+P` → "Tasks: Run Task"
3. Select "Build Module" or "Watch and Build"

#### Common Issues

**Module Not Loading**
- Check browser console for errors
- Verify module.json syntax
- Ensure all files are in correct directories
- Check FoundryVTT version compatibility

**TypeScript Errors**
- Run `npm run type-check` to see all type errors
- Check that all imports resolve correctly
- Verify Foundry VTT type definitions

**Build Errors**
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear cache: `npm run clean && npm run build`
- Check Vite configuration

## API Usage Examples

### Basic Knowledge Check
```javascript
// Get an actor
const actor = game.actors.getName("Goblin");

// Perform knowledge check
game.RecallKnowledge.knowledge.performCheck(actor, 'nature', { dc: 12 })
  .then(result => {
    console.log(`Result: ${result.result}`);
    console.log(`Roll: ${result.total} vs DC ${result.dc}`);
  });
```

### Creating Custom Rules
```javascript
// Create a knowledge rule
const knowledgeRule = game.RecallKnowledge.rules.createKnowledgeRule({
  key: 'knowledge.undead',
  label: 'Undead Knowledge',
  type: 'religion',
  dc: 15,
  success: 'You recognize this as an undead creature.',
  criticalSuccess: 'You know this undead\'s specific weaknesses and abilities.'
});

// Add it to the rules engine
game.RecallKnowledge.rules.addRuleElement(knowledgeRule);

// Create a modifier rule
const modifierRule = game.RecallKnowledge.rules.createModifierRule({
  key: 'modifier.cleric-undead',
  label: 'Cleric vs Undead',
  selector: 'skill-check',
  type: 'circumstance',
  value: 2,
  predicate: ['action:recall-knowledge', 'target:trait:undead', 'class:cleric']
});

// Add the modifier
game.RecallKnowledge.rules.addRuleElement(modifierRule);
```

### Socket Communication
```javascript
// Share knowledge with other players
game.RecallKnowledge.socket.shareKnowledge({
  information: "This dragon breathes fire and has spell resistance",
  source: "Arcana check (Critical Success)",
  confidence: "high"
}, dragonActorId, [userId1, userId2]);

// Broadcast a rule update (GM only)
game.RecallKnowledge.socket.updateRules(newRule, 'add');
```

## File Structure

```
recall-knowledge/
├── module.json           # Module manifest
├── README.md            # Documentation
├── CHANGELOG.md         # Version history
├── LICENSE              # License file
├── .gitignore          # Git ignore rules
├── package.json         # Node.js dependencies
├── tsconfig.json        # TypeScript configuration
├── vite.config.js       # Build configuration
├── .eslintrc.js         # Linting rules
├── .prettierrc.json     # Code formatting
├── .vscode/             # VS Code settings
│   ├── settings.json
│   ├── tasks.json
│   └── extensions.json
├── src/                 # Source code
│   ├── recall-knowledge.ts  # Main entry point
│   ├── modules/         # Module components
│   │   ├── api.ts       # External API
│   │   ├── hooks.ts     # Hook management
│   │   ├── rules-engine.ts  # Rules processing
│   │   ├── settings.ts  # Settings management
│   │   └── socket.ts    # Socket communication
│   └── types/           # Type definitions
│       └── foundry.d.ts
├── dist/                # Compiled output
│   └── recall-knowledge.js
├── styles/              # CSS stylesheets
│   └── recall-knowledge.css
└── lang/                # Localization
    └── en.json
```

## Troubleshooting

### Performance Issues
- Disable debug mode in production
- Check for memory leaks in long-running sessions
- Monitor browser console for performance warnings

### Compatibility Issues
- Verify FoundryVTT version (v13+ required)
- Check for conflicts with other modules
- Test with minimal module setup

### Getting Help
- Check the [GitHub Issues](https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/issues)
- Join the FoundryVTT Discord community
- Enable debug mode and provide console logs

## Contributing

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request with detailed description

## Module Settings

The module provides these configuration options:

- **Enable Rules Engine**: Toggle enhanced rules functionality
- **Debug Mode**: Enable detailed logging
- **Auto-Roll Knowledge**: Automatic knowledge checks
- **Maximum Knowledge Attempts**: Limit attempts per creature
- **Chat Output Style**: Control result display format

Access via: Configure Settings → Module Settings → Recall Knowledge