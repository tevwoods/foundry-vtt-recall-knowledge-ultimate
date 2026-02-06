# Recall Knowledge Module - Test Suite

This directory contains unit tests for the Recall Knowledge module.

## Test Coverage

The test suite includes comprehensive tests for:

### Core Functionality
- ✅ Module initialization and API exposure
- ✅ Settings registration and retrieval
- ✅ Knowledge skills detection and sorting
- ✅ Appropriate skills determination by creature type

### PF2e Integration
- ✅ Bestiary Scholar feat support
- ✅ Thorough Reports feat detection and tracking
- ✅ Scrollmaster Dedication bonus
- ✅ Assurance feat detection
- ✅ Know-It-All and other bonus info feats

### Information Management
- ✅ Information piece calculation
- ✅ Information storage and retrieval
- ✅ Deduplication of learned information
- ✅ Party knowledge sharing
- ✅ DC progression tracking

### Creature Information
- ✅ Creature type detection from traits
- ✅ Save extraction (highest/lowest)
- ✅ Resistance/Weakness/Immunity extraction
- ✅ Attack and skill information
- ✅ False information generation

### Settings
- ✅ GM approval requirement
- ✅ Auto-calculate DC
- ✅ Hide roll results
- ✅ False info on critical failure
- ✅ Party knowledge sharing

## Running the Tests

### Method 1: Browser Console (Recommended)

1. Launch FoundryVTT and load a world with the Recall Knowledge module enabled
2. Open the browser console (F12)
3. Load the test file by running:
   ```javascript
   // Option A: Load from module directory
   import('/modules/recall-knowledge/tests/recall-knowledge.test.js');
   
   // Option B: Copy and paste the entire test file contents into console
   ```
4. Run the tests:
   ```javascript
   await runRecallKnowledgeTests();
   ```

### Method 2: Include in Module

Add the test file to your module.json and load it during development:

```json
{
  "scripts": [
    "scripts/recall-knowledge.js",
    "tests/recall-knowledge.test.js"
  ]
}
```

Then in console:
```javascript
await runRecallKnowledgeTests();
```

### Method 3: Test Runner Script

Create a macro in FoundryVTT:

```javascript
// Import and run tests
const testModule = await import('/modules/recall-knowledge/tests/recall-knowledge.test.js');
const results = await runRecallKnowledgeTests();

// Display results
const content = `
<h2>Test Results</h2>
<p><strong>Total:</strong> ${results.total}</p>
<p style="color: green;"><strong>Passed:</strong> ${results.passed}</p>
<p style="color: red;"><strong>Failed:</strong> ${results.failed}</p>
<hr>
<h3>Details:</h3>
<ul>
${results.results.map(r => `
  <li style="color: ${r.status === 'PASS' ? 'green' : 'red'}">
    ${r.status === 'PASS' ? '✓' : '✗'} ${r.name}
    ${r.error ? `<br><em>${r.error}</em>` : ''}
  </li>
`).join('')}
</ul>
`;

new Dialog({
  title: 'Test Results',
  content: content,
  buttons: {
    ok: { label: 'OK' }
  }
}).render(true);
```

## Test Results Interpretation

### Successful Test Run
```
================================================================================
RECALL KNOWLEDGE MODULE - TEST SUITE
================================================================================
✓ Module is loaded and initialized
✓ API is exposed on game object
✓ Module is marked as initialized
...
================================================================================
Tests Complete: 45 passed, 0 failed
================================================================================
```

### Failed Test Example
```
✗ Can detect bonus information feats
  Error: Expected boolean, got undefined
```

## Prerequisites

For tests to run successfully:

1. **FoundryVTT** must be running with an active world
2. **PF2e System** must be installed and active
3. **Recall Knowledge module** must be enabled
4. At least one **actor** must exist in the world (for actor-based tests)
5. **User must be logged in** (for flag/setting tests)

## Test Categories

### Smoke Tests (Must Pass)
- Module initialization
- API exposure
- Settings existence

### Feature Tests
- Knowledge skill detection
- Feat detection
- Information calculation
- Storage and retrieval

### Integration Tests
- PF2e creature type detection
- Party sharing mechanics
- DC calculation and progression

### Edge Case Tests
- Empty actor scenarios
- Missing creature traits
- Deduplication logic

## Adding New Tests

To add a new test:

```javascript
tests.test('Description of what this tests', () => {
    // Arrange
    const actor = game.actors.contents[0];
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    
    // Act
    const result = manager.someMethod(actor);
    
    // Assert
    tests.assert(result, 'Expected truthy result');
    tests.assertEqual(result, expectedValue, 'Values should match');
});
```

## Continuous Integration

These tests can be integrated into a CI/CD pipeline using:

- **Foundry Test Runner** - Automated Foundry testing framework
- **Puppeteer** - Headless browser automation
- **GitHub Actions** - Automated testing on push/PR

Example CI configuration coming soon.

## Troubleshooting

### "No actors available for testing"
- Create at least one actor in your world before running tests

### "Module not found in game.modules"
- Ensure the module is properly installed and enabled

### "Cannot read property 'recallKnowledgeManager' of undefined"
- Make sure the module has fully initialized before running tests
- Try waiting a few seconds after world load

### Import errors
- Ensure the test file path is correct
- Check browser console for CORS or module loading errors

## Contributing

When adding new features to the module:

1. Write tests for the new functionality
2. Run the test suite to ensure no regressions
3. Update this README with any new test categories
4. Document any new prerequisites or setup requirements
