# Learned Information Display - Test Documentation

## Overview
Comprehensive test suite for the new "What was learned" feature that displays selected information directly in the recall knowledge result card.

## Test Statistics
- **Total Tests Added**: 25 new tests (12 unit tests + 13 integration tests)
- **Total Test Suite**: 67 tests passing
- **Test Files Modified**: 2

---

## Unit Tests (`tests/unit/information.test.js`)

### Learned Information Display (4 tests)
Tests the HTML generation and structure of learned information items.

1. **should generate HTML for learned information items**
   - Verifies correct HTML structure with `rk-learned-item` class
   - Tests multiple information items rendering
   - Validates label and value formatting

2. **should format learned content container**
   - Tests the `rk-learned-content` wrapper
   - Ensures proper nesting of items

3. **should handle empty learned information**
   - Validates graceful handling of no information selected
   - Ensures empty arrays don't cause errors

4. **should escape HTML in learned information values**
   - Security test to prevent XSS attacks
   - Validates HTML entities are escaped properly

### False Information Generation (3 tests)
Tests the generation of false information for critical failures.

5. **should generate false highest save information**
   - Validates random save selection
   - Tests bonus value generation (5-25 range)
   - Verifies HTML structure

6. **should generate false resistances information**
   - Tests random damage type selection
   - Validates resistance value generation
   - Tests "None" case handling

7. **should format false information consistently**
   - Tests all 7 information types
   - Validates consistent HTML structure across types
   - Ensures proper strong tags and div wrapping

### Chat Message Visibility (3 tests)
Tests whisper list generation based on party sharing settings.

8. **should set whisper list for party sharing enabled**
   - Validates empty whisper list when sharing
   - Tests public visibility logic

9. **should set whisper list for party sharing disabled**
   - Validates whisper to player and GMs only
   - Tests private visibility logic
   - Verifies all GM users are included

10. **should identify GM users correctly**
    - Tests GM user filtering
    - Validates user role detection

### Chat Message Content Updates (3 tests)
Tests the dynamic update mechanism for chat messages.

11. **should replace placeholder with learned content**
    - Tests regex replacement of loading state
    - Validates new content insertion
    - Ensures placeholder removal

12. **should preserve other content when updating learned section**
    - Tests that only the learned section updates
    - Validates header, target, and DC preservation
    - Ensures surgical content replacement

13. **should handle multiple information items in update**
    - Tests rendering of 3+ information items
    - Validates correct class count
    - Ensures proper item separation

---

## Integration Tests (`tests/recall-knowledge.test.js`)

### Learned Information Display Tests (13 tests)

14. **Chat message includes learned information section**
    - Tests initial chat message structure
    - Validates presence of `rk-learned`, `rk-learned-label`, and `rk-learned-content`
    - Verifies data attributes (actor-id, target-id)
    - Checks loading state display

15. **Learned content updates with selected information**
    - Tests the content replacement mechanism
    - Validates information appears in chat
    - Ensures loading state is removed

16. **Learned information items have correct HTML structure**
    - Tests div structure
    - Validates strong tags for labels
    - Verifies proper opening/closing tags

17. **Party sharing affects whisper list correctly**
    - Tests both enabled and disabled states
    - Validates whisper arrays
    - Verifies user inclusion logic

18. **False information generates correct HTML format**
    - Tests all 7 false information types
    - Validates HTML structure consistency
    - Ensures proper formatting for each type

19. **Chat message flags store necessary data**
    - Tests flag storage in chat messages
    - Validates actorId, targetId, isFalseInfo, shareWithParty
    - Ensures data persistence

20. **Learned section data attributes are present**
    - Tests data-actor-id attribute
    - Tests data-target-id attribute
    - Tests data-is-false attribute
    - Validates actual IDs are included

21. **Multiple learned items display correctly**
    - Tests 4 different information items
    - Validates all items render
    - Ensures proper HTML class count

22. **Empty learned information handled gracefully**
    - Tests empty array handling
    - Validates no errors on zero items
    - Ensures empty string result

23. **Content replacement preserves message structure**
    - Tests complex message structure
    - Validates header preservation
    - Tests target preservation
    - Tests DC preservation
    - Ensures surgical content update

24. **Chat message visibility with shareWithParty setting**
    - Tests whisper behavior
    - Validates public vs private visibility
    - Tests GM always sees content

25. **False information types all have proper structure**
    - Tests 7 information types
    - Validates HTML consistency
    - Ensures divs and strong tags

---

## Test Coverage

### Features Covered
✅ HTML generation for learned items  
✅ False information generation  
✅ Chat message visibility control  
✅ Content replacement mechanism  
✅ Data attribute preservation  
✅ Empty state handling  
✅ XSS prevention  
✅ Multi-item rendering  
✅ Party sharing logic  
✅ Message structure preservation  

### Edge Cases Tested
- Empty information arrays
- HTML injection attempts
- Multiple information items
- Content replacement regex
- Whisper list generation
- All information types (7 types)
- Both true and false information

---

## Running the Tests

### Unit Tests (Jest)
```bash
npm test
```

Expected output:
```
Test Suites: 4 passed, 4 total
Tests:       67 passed, 67 total
Time:        ~0.4s
```

### Integration Tests (FoundryVTT)
1. Load FoundryVTT with the module enabled
2. Open browser console (F12)
3. Run: `runRecallKnowledgeTests()`

Expected output:
```
Tests Complete: X passed, 0 failed
```

---

## Test Quality Metrics

- **Line Coverage**: High coverage of learned information display code
- **Branch Coverage**: Tests both party sharing states
- **Error Handling**: Tests empty states and invalid inputs
- **Security**: Includes XSS prevention test
- **Integration**: Tests full workflow from selection to display

---

## Future Test Considerations

Potential additional tests to add:
- Performance tests for many simultaneous information items
- Accessibility tests for screen readers
- Mobile/responsive layout tests
- Internationalization tests for labels
- Network failure handling for chat message updates
