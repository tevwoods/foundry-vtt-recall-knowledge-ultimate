# Recall Knowledge - FoundryVTT Module

A comprehensive FoundryVTT module that enhances the rules engine functionality and provides advanced knowledge management features for tabletop RPGs.

## Features

- **Knowledge Management**: Advanced recall knowledge checks with detailed results and tracking
## Installation

### Automatic Installation (Recommended)
1. Open Foundry VTT and navigate to the "Add-on Modules" tab
2. Click "Install Module" 
3. Paste the following manifest URL: `https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/latest/download/module.json`
4. Click "Install"

### Manual Installation
1. Download the latest release from the [Releases](https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases) page
2. Extract the zip file to your Foundry VTT `Data/modules/` directory
3. Restart Foundry VTT
4. Enable the module in your world's module settings

## Usage

### Basic Knowledge Checks
1. Select a token representing a creature you want to identify
2. Use the knowledge check button in the token HUD or run a macro
3. Choose the appropriate knowledge skill (Arcana, Nature, etc.)
4. The module will handle the roll and display results based on success level

### Creating Custom Rule Elements
```javascript
// Example: Add a custom knowledge modifier
const api = game.RecallKnowledge;
const modifier = api.rules.createModifierRule({
  key: 'modifier.scholar-bonus',
  label: 'Scholar\'s Bonus',
  selector: 'skill-check',
  type: 'circumstance',
  value: 2,
  predicate: ['action:recall-knowledge', 'trait:scholarly']
});
api.rules.addRuleElement(modifier);
```

### Using the Socket System
```javascript
// Share knowledge with other players
const api = game.RecallKnowledge;
api.socket.shareKnowledge({
  information: "This creature is vulnerable to fire damage",
  source: "Arcana check"
}, targetActorId, [userId1, userId2]);
```

## Configuration

The module provides several configuration options:

- **Enable Rules Engine**: Toggle the enhanced rules engine functionality
- **Debug Mode**: Enable detailed logging for troubleshooting
- **Auto-Roll Knowledge**: Automatically perform knowledge checks under certain conditions
- **Maximum Knowledge Attempts**: Limit the number of attempts per creature
- **Chat Output Style**: Control how results are displayed in chat

## API Reference

### Settings API
```javascript
// Get a setting
const value = game.RecallKnowledge.settings.get('debugMode');

// Set a setting
await game.RecallKnowledge.settings.set('autoRollKnowledge', true);
```

### Rules API
```javascript
// Add a rule element
game.RecallKnowledge.rules.addRuleElement(ruleElement);

// Get all rules
const rules = game.RecallKnowledge.rules.getAllRuleElements();

// Create a knowledge rule
const knowledgeRule = game.RecallKnowledge.rules.createKnowledgeRule({
  key: 'knowledge.dragon',
  label: 'Dragon Knowledge',
  type: 'arcana',
  dc: 20
});
```

### Knowledge API
```javascript
// Perform a knowledge check
const result = await game.RecallKnowledge.knowledge.performCheck(
  actor, 
  'arcana', 
  { dc: 15, target: targetActor }
);

// Get known information
const knowledge = game.RecallKnowledge.knowledge.getKnownInformation(actor);

// Add knowledge
game.RecallKnowledge.knowledge.addKnowledge(actor, {
  information: "Immune to charm effects",
  source: "Religion check",
  confidence: "high"
});
```

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- FoundryVTT v13+

### Setup
```bash
# Clone the repository
git clone https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate.git
cd recall-knowledge

# Install dependencies
npm install

# Build the module
npm run build

# Development mode (watch for changes)
npm run dev
```

### Project Structure
```
recall-knowledge/
├── src/
│   ├── modules/         # Core module functionality
│   │   ├── api.ts       # External API interface
│   │   ├── hooks.ts     # Hook management
│   │   ├── rules-engine.ts  # Rules processing
│   │   ├── settings.ts  # Configuration management
│   │   └── socket.ts    # Multiplayer communication
│   ├── types/          # TypeScript definitions
│   └── recall-knowledge.ts  # Main entry point
├── lang/               # Localization files
├── styles/            # CSS stylesheets
├── dist/              # Compiled output (generated)
├── module.json        # Module manifest
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── vite.config.js     # Build configuration
```

### Building
```bash
# Clean build
npm run clean && npm run build

# Type checking only
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint/Prettier)
- Add JSDoc comments for public APIs
- Include unit tests for new functionality

## Compatibility

- **FoundryVTT**: v13+ (tested with v13.350)
- **Game Systems**: System-agnostic, with enhanced support for:
  - Pathfinder 2e (PF2e)
  - D&D 5e
  - Other d20-based systems

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/issues)
- **Discord**: [FoundryVTT Community Discord](https://discord.gg/foundryvtt)
- **Documentation**: [Module Wiki](https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/wiki)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## Acknowledgments

- Foundry Gaming LLC for the amazing FoundryVTT platform
- The PF2e system developers for inspiration on rule element patterns
- The FoundryVTT community for feedback and support

## Roadmap

### Planned Features
- [ ] Visual rule element editor UI
- [ ] Advanced knowledge templates system
- [ ] Integration with popular compendiums
- [ ] Mobile-responsive interfaces
- [ ] Additional game system support
- [ ] Rule element import/export functionality
- [ ] Enhanced automation options

### Long-term Goals
- [ ] Machine learning for DC calculation
- [ ] Voice-activated knowledge checks
- [ ] AR/VR integration support
- [ ] Advanced analytics and reporting