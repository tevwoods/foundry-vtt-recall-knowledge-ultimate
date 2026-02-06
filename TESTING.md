# Running Unit Tests

This module includes comprehensive Jest-based unit tests that can be run from the command line.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- **Git** (required by some npm packages)

### Installing Git (if not installed)

If you get "spawn git ENOENT" errors when running `npm install`, you need to install Git:

1. Download Git from https://git-scm.com/download/win
2. Install with default options
3. Restart your terminal/PowerShell
4. Verify with: `git --version`

## Setup

1. Navigate to the module directory:
```bash
cd recall-knowledge
```

2. Install dependencies:
```bash
npm install
```

This will install:
- jest (testing framework)
- @types/jest (TypeScript types for Jest)
- All other development dependencies

## Running Tests

### Run all tests once:
```bash
npm test
```

### Run tests in watch mode (re-runs on file changes):
```bash
npm run test:watch
```

### Run tests with coverage report:
```bash
npm run test:coverage
```

## Test Files

Unit tests are located in `tests/unit/`:
- `skills.test.js` - Skill detection and appropriate skills
- `feats.test.js` - Feat detection and bonuses
- `calculations.test.js` - DC and information calculations  
- `information.test.js` - Information extraction and deduplication
- `test-helpers.js` - Mock FoundryVTT APIs and factory functions

## Coverage Report

After running `npm run test:coverage`, open `coverage/lcov-report/index.html` in your browser to view a detailed coverage report.

## Adding New Tests

When implementing new features:

1. Add unit tests in the appropriate `tests/unit/*.test.js` file
2. Use the mock factories from `test-helpers.js`
3. Run tests to verify: `npm test`
4. Also add integration tests in `tests/recall-knowledge.test.js` for FoundryVTT

Example:
```javascript
import { createMockActor, createMockFeat } from './test-helpers.js';

describe('My New Feature', () => {
  test('should work correctly', () => {
    const actor = createMockActor({
      items: [createMockFeat('New Feat', 'new-feat')],
    });
    
    // Your test logic here
    expect(result).toBe(expected);
  });
});
```

## Troubleshooting

### "Cannot find module" errors
Make sure you've run `npm install` first.

### Tests fail with Foundry API errors
The unit tests use mocked Foundry APIs from `test-helpers.js`. If you see errors about missing Foundry objects, check that the mocks are properly imported and set up.

### Git errors during npm install
Some packages may reference git repositories. Ensure git is installed and in your PATH, or use `npm install --no-optional` to skip optional dependencies.
