# Unit Tests for Recall Knowledge Module

This directory contains Jest-based unit tests that can be run from the command line without requiring a FoundryVTT instance.

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

## Test Structure

The unit tests are organized into separate files by functionality:

### `skills.test.js`
- Skill detection and filtering
- Skill sorting by modifier
- Appropriate skill determination for creature types
- Bestiary Scholar feature
- Universal Lore skills (Bardic Lore, Esoteric Lore, etc.)

### `feats.test.js`
- Feat detection (Know-It-All, Thorough Research, Thorough Reports, etc.)
- Assurance feat detection and calculation
- Diverse Recognition feat detection
- Information bonus calculation from feats

### `calculations.test.js`
- Information count calculation based on success level
- DC calculation based on creature level
- DC adjustment for repeated attempts
- Thorough Reports bonus calculation
- Creature type detection from traits

### `information.test.js`
- Highest/Lowest save extraction
- Weakness/Resistance/Immunity extraction
- Information deduplication
- Information label mapping

## Test Helpers

The `test-helpers.js` file provides:
- Mock FoundryVTT API objects (`game`, `ui`, `ChatMessage`, etc.)
- Factory functions for creating test actors and targets
- Utility functions for resetting mocks between tests

## Coverage

Run `npm run test:coverage` to generate a detailed coverage report. The report will be available in:
- Console output (text summary)
- `coverage/lcov-report/index.html` (HTML report)

## Integration with FoundryVTT Tests

These unit tests complement the in-browser integration tests in `tests/recall-knowledge.test.js`. 

**Unit Tests (Command Line)**:
- Fast execution
- No FoundryVTT runtime required
- Test individual functions and logic
- Run during development and CI/CD

**Integration Tests (FoundryVTT)**:
- Test complete workflows
- Verify UI interactions
- Test with real FoundryVTT APIs
- Run before releases

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Unit Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Writing New Tests

When adding new features:

1. Add unit tests for the core logic
2. Use the factory functions from `test-helpers.js`
3. Follow the existing test structure
4. Add integration tests in `recall-knowledge.test.js` for UI/workflow testing

Example:
```javascript
import { createMockActor, createMockFeat } from './test-helpers.js';

test('should detect new feature', () => {
  const actor = createMockActor({
    items: [createMockFeat('New Feature', 'new-feature')],
  });
  
  // Test your logic here
  expect(result).toBe(expected);
});
```
