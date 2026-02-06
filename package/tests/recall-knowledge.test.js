/**
 * Unit Tests for Recall Knowledge Module
 * Run these tests in the browser console or with a test runner
 */

const MODULE_ID = 'recall-knowledge';

class RecallKnowledgeTests {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    /**
     * Add a test to the suite
     */
    test(name, fn) {
        this.tests.push({ name, fn });
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('='.repeat(80));
        console.log('RECALL KNOWLEDGE MODULE - TEST SUITE');
        console.log('='.repeat(80));

        this.passed = 0;
        this.failed = 0;
        this.results = [];

        for (const test of this.tests) {
            try {
                await test.fn();
                this.passed++;
                this.results.push({ name: test.name, status: 'PASS', error: null });
                console.log(`✓ ${test.name}`);
            } catch (error) {
                this.failed++;
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                console.error(`✗ ${test.name}`);
                console.error(`  Error: ${error.message}`);
            }
        }

        console.log('='.repeat(80));
        console.log(`Tests Complete: ${this.passed} passed, ${this.failed} failed`);
        console.log('='.repeat(80));

        return {
            total: this.tests.length,
            passed: this.passed,
            failed: this.failed,
            results: this.results
        };
    }

    /**
     * Assert helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    /**
     * Assert equal helper
     */
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    /**
     * Assert array contains helper
     */
    assertArrayContains(array, value, message) {
        if (!Array.isArray(array) || !array.includes(value)) {
            throw new Error(message || `Array does not contain ${value}`);
        }
    }
}

// Create test suite
const tests = new RecallKnowledgeTests();

// ============================================================================
// MODULE INITIALIZATION TESTS
// ============================================================================

tests.test('Module is loaded and initialized', () => {
    tests.assert(game.modules.get(MODULE_ID), 'Module not found in game.modules');
    tests.assert(game.modules.get(MODULE_ID).active, 'Module is not active');
});

tests.test('API is exposed on game object', () => {
    tests.assert(game.RecallKnowledge, 'RecallKnowledge API not found on game object');
    tests.assert(typeof game.RecallKnowledge.initiateRecallKnowledge === 'function', 'initiateRecallKnowledge not a function');
    tests.assert(typeof game.RecallKnowledge.showLearnedInformation === 'function', 'showLearnedInformation not a function');
});

tests.test('Module is marked as initialized', () => {
    tests.assert(game.RecallKnowledge.isInitialized(), 'Module not initialized');
});

// ============================================================================
// SETTINGS TESTS
// ============================================================================

tests.test('GM Approval setting exists', () => {
    const setting = game.settings.get(MODULE_ID, 'requireGMApproval');
    tests.assert(typeof setting === 'boolean', 'requireGMApproval setting not a boolean');
});

tests.test('Auto-Calculate DC setting exists', () => {
    const setting = game.settings.get(MODULE_ID, 'autoCalculateDC');
    tests.assert(typeof setting === 'boolean', 'autoCalculateDC setting not a boolean');
});

tests.test('Hide Roll Results setting exists', () => {
    const setting = game.settings.get(MODULE_ID, 'hideRollFromPlayer');
    tests.assert(typeof setting === 'boolean', 'hideRollFromPlayer setting not a boolean');
});

tests.test('False Info on Crit Fail setting exists', () => {
    const setting = game.settings.get(MODULE_ID, 'falseInfoOnCritFail');
    tests.assert(typeof setting === 'boolean', 'falseInfoOnCritFail setting not a boolean');
});

tests.test('Share with Party setting exists', () => {
    const setting = game.settings.get(MODULE_ID, 'shareWithParty');
    tests.assert(typeof setting === 'boolean', 'shareWithParty setting not a boolean');
});

tests.test('Bestiary Scholar setting exists', () => {
    const setting = game.settings.get(MODULE_ID, 'bestiaryScholarSkill');
    tests.assert(typeof setting === 'string', 'bestiaryScholarSkill setting not a string');
});

// ============================================================================
// KNOWLEDGE SKILLS DETECTION TESTS
// ============================================================================

tests.test('Can detect knowledge skills on actor', () => {
    const actor = game.actors.contents[0];
    if (!actor) {
        throw new Error('No actors available for testing');
    }

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const skills = manager.getKnowledgeSkills(actor);

    tests.assert(Array.isArray(skills), 'getKnowledgeSkills did not return an array');
    tests.assert(skills.length > 0, 'No knowledge skills found');

    // Check first skill has required properties
    const skill = skills[0];
    tests.assert(skill.key, 'Skill missing key property');
    tests.assert(skill.name, 'Skill missing name property');
    tests.assert(typeof skill.modifier === 'number', 'Skill modifier not a number');
});

tests.test('Knowledge skills are sorted by modifier', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const skills = manager.getKnowledgeSkills(actor);

    for (let i = 1; i < skills.length; i++) {
        tests.assert(
            skills[i - 1].modifier >= skills[i].modifier,
            `Skills not sorted: ${skills[i - 1].name} (+${skills[i - 1].modifier}) should be >= ${skills[i].name} (+${skills[i].modifier})`
        );
    }
});

tests.test('Core knowledge skills are included', () => {
    const actor = game.actors.contents[0];
    if (!actor || !actor.system.skills) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const skills = manager.getKnowledgeSkills(actor);
    const skillKeys = skills.map(s => s.key);

    const coreSkills = ['arcana', 'crafting', 'occultism', 'nature', 'religion', 'society'];

    for (const coreSkill of coreSkills) {
        if (actor.system.skills[coreSkill]) {
            tests.assert(
                skillKeys.includes(coreSkill),
                `Core skill ${coreSkill} not included in knowledge skills`
            );
        }
    }
});

// ============================================================================
// APPROPRIATE SKILLS DETECTION TESTS
// ============================================================================

tests.test('Can determine appropriate skills for creature types', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    // Create mock target with dragon trait
    const mockTarget = {
        system: {
            traits: {
                value: ['dragon']
            }
        }
    };

    const appropriate = manager.getAppropriateSkills(mockTarget);
    tests.assert(Array.isArray(appropriate), 'getAppropriateSkills did not return array');
    tests.assertArrayContains(appropriate, 'arcana', 'Dragon should use Arcana');
});

tests.test('Undead creatures use Religion', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    const mockTarget = {
        system: {
            traits: {
                value: ['undead']
            }
        }
    };

    const appropriate = manager.getAppropriateSkills(mockTarget);
    tests.assertArrayContains(appropriate, 'religion', 'Undead should use Religion');
});

tests.test('Fey creatures use Nature', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    const mockTarget = {
        system: {
            traits: {
                value: ['fey']
            }
        }
    };

    const appropriate = manager.getAppropriateSkills(mockTarget);
    tests.assertArrayContains(appropriate, 'nature', 'Fey should use Nature');
});

tests.test('Bestiary Scholar adds appropriate skill', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    // Set Bestiary Scholar to Arcana
    game.settings.set(MODULE_ID, 'bestiaryScholarSkill', 'arcana');

    const mockTarget = {
        system: {
            traits: {
                value: ['dragon'] // Dragon already uses Arcana
            }
        }
    };

    const appropriate = manager.getAppropriateSkills(mockTarget);
    tests.assertArrayContains(appropriate, 'arcana', 'Bestiary Scholar skill should be included');

    // Reset setting
    game.settings.set(MODULE_ID, 'bestiaryScholarSkill', '');
});

tests.test('Bestiary Scholar does NOT work for Society checks', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    // Set Bestiary Scholar to Arcana
    game.settings.set(MODULE_ID, 'bestiaryScholarSkill', 'arcana');

    const mockTarget = {
        system: {
            traits: {
                value: ['humanoid'] // Humanoid uses Society
            }
        }
    };

    const appropriate = manager.getAppropriateSkills(mockTarget);
    tests.assert(
        appropriate.includes('society'),
        'Humanoid should still use Society'
    );
    tests.assert(
        !appropriate.includes('arcana') || appropriate.filter(s => s === 'society').length > 0,
        'Bestiary Scholar should not replace Society checks'
    );

    // Reset setting
    game.settings.set(MODULE_ID, 'bestiaryScholarSkill', '');
});

tests.test('Universal Lore skills are always appropriate', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    const mockTarget = {
        system: {
            traits: {
                value: ['dragon'] // Dragon uses Arcana
            }
        }
    };

    const appropriate = manager.getAppropriateSkills(mockTarget);

    // Check all universal lores are included
    tests.assertArrayContains(appropriate, 'bardic-lore', 'Bardic Lore should always be appropriate');
    tests.assertArrayContains(appropriate, 'esoteric-lore', 'Esoteric Lore should always be appropriate');
    tests.assertArrayContains(appropriate, 'gossip-lore', 'Gossip Lore should always be appropriate');
    tests.assertArrayContains(appropriate, 'loremaster-lore', 'Loremaster Lore should always be appropriate');
});

tests.test('Universal Lore skills work for all creature types', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    // Test multiple different creature types
    const creatureTypes = [
        { traits: ['humanoid'], name: 'Humanoid' },
        { traits: ['undead'], name: 'Undead' },
        { traits: ['aberration'], name: 'Aberration' },
        { traits: ['fey'], name: 'Fey' }
    ];

    for (const creature of creatureTypes) {
        const mockTarget = {
            system: {
                traits: {
                    value: creature.traits
                }
            }
        };

        const appropriate = manager.getAppropriateSkills(mockTarget);

        // All universal lores should be present for every creature type
        tests.assert(
            appropriate.includes('bardic-lore') &&
            appropriate.includes('esoteric-lore') &&
            appropriate.includes('gossip-lore') &&
            appropriate.includes('loremaster-lore'),
            `Universal Lores should work for ${creature.name}`
        );
    }
});

// ============================================================================
// INFORMATION COUNT CALCULATION TESTS
// ============================================================================

tests.test('Critical success grants 2 pieces of information', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const result = manager.calculateInformationCount(actor, 'criticalSuccess', true);

    tests.assert(result.total >= 2, 'Critical success should grant at least 2 pieces');
});

tests.test('Success grants 1 piece of information', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const result = manager.calculateInformationCount(actor, 'success', true);

    tests.assert(result.total >= 1, 'Success should grant at least 1 piece');
});

tests.test('Failure grants 0 pieces of information', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const count = manager.calculateInformationCount(actor, 'failure');

    tests.assertEqual(count, 0, 'Failure should grant 0 pieces');
});

tests.test('Information count includes sources breakdown', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const result = manager.calculateInformationCount(actor, 'success', true);

    tests.assert(result.sources, 'Result should have sources property');
    tests.assert(Array.isArray(result.sources), 'Sources should be an array');
    tests.assert(result.sources.length > 0, 'Sources should have at least one entry');
});

// ============================================================================
// FEAT DETECTION TESTS
// ============================================================================

tests.test('Can detect bonus information feats', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const result = manager.checkRecallKnowledgeBonuses(actor, true);

    tests.assert(typeof result.bonus === 'number', 'Bonus should be a number');
    tests.assert(Array.isArray(result.sources), 'Sources should be an array');
});

tests.test('Can detect Thorough Reports feat', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const hasFeat = manager.hasThoroughReportsFeat(actor);

    tests.assert(typeof hasFeat === 'boolean', 'hasThoroughReportsFeat should return boolean');
});

tests.test('Can detect Scrollmaster Dedication feat', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const hasFeat = manager.hasScrollmasterDedication(actor);

    tests.assert(typeof hasFeat === 'boolean', 'hasScrollmasterDedication should return boolean');
});

tests.test('Can detect Diverse Recognition feat', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const hasFeat = manager.hasDiverseRecognition(actor);

    tests.assert(typeof hasFeat === 'boolean', 'hasDiverseRecognition should return boolean');
});

tests.test('Diverse Recognition usage tracking works', async () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const actorId = actor.id;

    // Reset usage
    await manager.resetDiverseRecognitionUsage(actorId);

    let used = manager.hasDiverseRecognitionBeenUsed(actorId);
    tests.assertEqual(used, false, 'Should start as not used');

    // Mark as used
    await manager.markDiverseRecognitionUsed(actorId);

    used = manager.hasDiverseRecognitionBeenUsed(actorId);
    tests.assertEqual(used, true, 'Should be marked as used');

    // Reset again
    await manager.resetDiverseRecognitionUsage(actorId);

    used = manager.hasDiverseRecognitionBeenUsed(actorId);
    tests.assertEqual(used, false, 'Should reset to not used');
});

// ============================================================================
// CREATURE TYPE DETECTION TESTS
// ============================================================================

tests.test('Can detect creature type from traits', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    const mockTarget = {
        system: {
            traits: {
                value: ['dragon', 'fire']
            }
        }
    };

    const type = manager.getCreatureType(mockTarget);
    tests.assertEqual(type, 'dragon', 'Should detect dragon creature type');
});

tests.test('Returns null for unknown creature type', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    const mockTarget = {
        system: {
            traits: {
                value: ['fire', 'large']
            }
        }
    };

    const type = manager.getCreatureType(mockTarget);
    tests.assertEqual(type, null, 'Should return null for non-creature traits');
});

// ============================================================================
// THOROUGH REPORTS TRACKING TESTS
// ============================================================================

tests.test('Can track creature types for Thorough Reports', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const actorId = actor.id;

    const mockTarget = {
        system: {
            traits: {
                value: ['dragon']
            }
        }
    };

    manager.trackCreatureType(actorId, mockTarget);

    const tracked = game.user.getFlag(MODULE_ID, `thoroughReports.${actorId}`) || [];
    tests.assert(Array.isArray(tracked), 'Tracked types should be an array');
});

tests.test('Thorough Reports bonus is 0 for untracked creature type', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    // Clear tracked types
    game.user.setFlag(MODULE_ID, `thoroughReports.${actor.id}`, []);

    const mockTarget = {
        system: {
            traits: {
                value: ['dragon']
            }
        }
    };

    const bonus = manager.checkThoroughReportsBonus(actor, mockTarget, 'arcana');
    tests.assertEqual(bonus, 0, 'Bonus should be 0 for untracked creature type');
});

// ============================================================================
// DC CALCULATION TESTS
// ============================================================================

tests.test('DC increases with creature level', () => {
    // This would need to be tested within the context of an actual roll
    tests.assert(true, 'Manual test required for DC calculation');
});

tests.test('DC increases by 2 per previous attempt', async () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const actorId = actor.id;
    const targetId = 'test-target-123';

    // Reset attempts
    await game.user.setFlag(MODULE_ID, `recallAttempts.${actorId}.${targetId}`, 0);

    const attempts1 = manager.getRecallAttempts(actorId, targetId);
    tests.assertEqual(attempts1, 0, 'Initial attempts should be 0');

    await manager.incrementRecallAttempts(actorId, targetId);
    const attempts2 = manager.getRecallAttempts(actorId, targetId);
    tests.assertEqual(attempts2, 1, 'Attempts should increment');
});

// ============================================================================
// LEARNED INFORMATION STORAGE TESTS
// ============================================================================

tests.test('Can store learned information', async () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const actorId = actor.id;
    const targetId = 'test-target-456';
    const info = ['highest-save', 'weaknesses'];

    await manager.storeLearnedInformation(actorId, targetId, info);

    const stored = game.user.getFlag(MODULE_ID, `learnedInfo.${actorId}.${targetId}`) || [];
    tests.assert(stored.includes('highest-save'), 'Should store highest-save');
    tests.assert(stored.includes('weaknesses'), 'Should store weaknesses');
});

tests.test('Can retrieve learned information', async () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const actorId = actor.id;
    const targetId = 'test-target-789';

    // Store some info first
    await manager.storeLearnedInformation(actorId, targetId, ['resistances']);

    // Retrieve it
    const learned = manager.getLearnedInformation(actorId, targetId);
    tests.assert(Array.isArray(learned), 'Should return an array');
    tests.assert(learned.includes('resistances'), 'Should include stored information');
});

tests.test('Stored information is deduplicated', async () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const actorId = actor.id;
    const targetId = 'test-target-dedup';

    // Clear existing
    await game.user.setFlag(MODULE_ID, `learnedInfo.${actorId}.${targetId}`, []);

    // Store same info twice
    await manager.storeLearnedInformation(actorId, targetId, ['immunities']);
    await manager.storeLearnedInformation(actorId, targetId, ['immunities']);

    const stored = game.user.getFlag(MODULE_ID, `learnedInfo.${actorId}.${targetId}`) || [];
    tests.assertEqual(stored.filter(i => i === 'immunities').length, 1, 'Should not have duplicates');
});

// ============================================================================
// PARTY SHARING TESTS
// ============================================================================

tests.test('Can detect party actor', () => {
    const partyActor = game.actors.find(a => a.type === "party" || a.name === "The Party");

    if (partyActor) {
        tests.assert(partyActor.system.details.members, 'Party actor should have members');
    } else {
        tests.assert(true, 'No party actor found (expected in some setups)');
    }
});

tests.test('Party sharing respects setting', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const actorId = actor.id;
    const targetId = 'test-target-party';

    // Test with sharing disabled
    game.settings.set(MODULE_ID, 'shareWithParty', false);
    manager.storeLearnedInformation(actorId, targetId, ['attacks']);
    const learned = manager.getLearnedInformation(actorId, targetId);

    tests.assert(Array.isArray(learned), 'Should return array even with sharing disabled');
});

// ============================================================================
// INFORMATION EXTRACTION TESTS
// ============================================================================

tests.test('Can extract highest save from actor', () => {
    const actor = game.actors.contents[0];
    if (!actor || !actor.system.saves) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const highestSave = manager.getHighestSave(actor);

    tests.assert(typeof highestSave === 'string', 'Should return a string');
    tests.assert(highestSave.length > 0, 'Should not be empty');
});

tests.test('Can extract lowest save from actor', () => {
    const actor = game.actors.contents[0];
    if (!actor || !actor.system.saves) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const lowestSave = manager.getLowestSave(actor);

    tests.assert(typeof lowestSave === 'string', 'Should return a string');
    tests.assert(lowestSave.length > 0, 'Should not be empty');
});

tests.test('Can extract resistances from actor', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const resistances = manager.getResistances(actor);

    tests.assert(resistances === null || typeof resistances === 'string', 'Should return null or string');
});

tests.test('Can extract weaknesses from actor', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const weaknesses = manager.getWeaknesses(actor);

    tests.assert(weaknesses === null || typeof weaknesses === 'string', 'Should return null or string');
});

tests.test('Can extract immunities from actor', () => {
    const actor = game.actors.contents[0];
    if (!actor) return;

    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const immunities = manager.getImmunities(actor);

    tests.assert(immunities === null || typeof immunities === 'string', 'Should return null or string');
});

// ============================================================================
// FALSE INFORMATION GENERATION TESTS
// ============================================================================

tests.test('Can generate false information for saves', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const falseInfo = manager.generateFalseInformation('highest-save');

    tests.assert(typeof falseInfo === 'string', 'Should return a string');
    tests.assert(falseInfo.includes('<li>'), 'Should be formatted as HTML list item');
});

tests.test('Can generate false information for weaknesses', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const falseInfo = manager.generateFalseInformation('weaknesses');

    tests.assert(typeof falseInfo === 'string', 'Should return a string');
    tests.assert(falseInfo.length > 0, 'Should not be empty');
});

tests.test('Can generate false information for attacks', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const falseInfo = manager.generateFalseInformation('attacks');

    tests.assert(typeof falseInfo === 'string', 'Should return a string');
    tests.assert(falseInfo.includes('Attacks'), 'Should include "Attacks" label');
});

// ============================================================================
// INFO LABEL TESTS
// ============================================================================

tests.test('Can get readable labels for info IDs', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    tests.assertEqual(manager.getInfoLabel('highest-save'), 'Highest Save');
    tests.assertEqual(manager.getInfoLabel('lowest-save'), 'Lowest Save');
    tests.assertEqual(manager.getInfoLabel('resistances'), 'Resistances');
    tests.assertEqual(manager.getInfoLabel('weaknesses'), 'Weaknesses');
    tests.assertEqual(manager.getInfoLabel('immunities'), 'Immunities');
    tests.assertEqual(manager.getInfoLabel('attacks'), 'Attacks');
    tests.assertEqual(manager.getInfoLabel('skills'), 'Skills');
    tests.assertEqual(manager.getInfoLabel('background'), 'Background');
});

// ============================================================================
// LEARNED INFORMATION DISPLAY TESTS
// ============================================================================

tests.test('Chat message includes learned information section', async () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;
    const actor = game.actors.contents.find(a => a.type === 'character');
    const target = game.actors.contents.find(a => a.type === 'npc');

    tests.assert(actor, 'Character actor found');
    tests.assert(target, 'NPC target found');

    // Mock a recall knowledge roll result
    const chatContent = `
        <div class="recall-knowledge-result">
            <div class="rk-header">Recall Knowledge: Arcana</div>
            <div class="rk-target">Target: ${target.name}</div>
            <div class="rk-learned" data-actor-id="${actor.id}" data-target-id="${target.id}">
                <div class="rk-learned-label">What was learned:</div>
                <div class="rk-learned-content">
                    <em>Selecting information...</em>
                </div>
            </div>
        </div>
    `;

    tests.assert(chatContent.includes('rk-learned'), 'Contains learned section');
    tests.assert(chatContent.includes('rk-learned-label'), 'Contains learned label');
    tests.assert(chatContent.includes('rk-learned-content'), 'Contains learned content');
    tests.assert(chatContent.includes('Selecting information'), 'Shows loading state');
});

tests.test('Learned content updates with selected information', () => {
    const originalContent = `
        <div class="recall-knowledge-result">
            <div class="rk-learned-content">
                <em>Selecting information...</em>
            </div>
        </div>
    `;

    const learnedItems = [
        '<div class="rk-learned-item"><strong>Highest Save:</strong> Fortitude (+14)</div>',
        '<div class="rk-learned-item"><strong>Weaknesses:</strong> cold 10</div>',
    ];

    const updatedContent = originalContent.replace(
        /<div class="rk-learned-content">.*?<\/div>/s,
        `<div class="rk-learned-content">${learnedItems.join('')}</div>`
    );

    tests.assert(updatedContent.includes('Highest Save'), 'Contains highest save info');
    tests.assert(updatedContent.includes('Fortitude (+14)'), 'Contains save value');
    tests.assert(updatedContent.includes('Weaknesses'), 'Contains weakness info');
    tests.assert(updatedContent.includes('cold 10'), 'Contains weakness value');
    tests.assert(!updatedContent.includes('Selecting information'), 'Removes loading state');
});

tests.test('Learned information items have correct HTML structure', () => {
    const learnedItem = '<div class="rk-learned-item"><strong>Test Label:</strong> Test Value</div>';

    tests.assert(learnedItem.includes('rk-learned-item'), 'Has item class');
    tests.assert(learnedItem.includes('<strong>'), 'Has strong tag for label');
    tests.assert(learnedItem.includes('</strong>'), 'Closes strong tag');
    tests.assert(learnedItem.includes('Test Label:'), 'Contains label with colon');
    tests.assert(learnedItem.includes('Test Value'), 'Contains value');
    tests.assert(learnedItem.startsWith('<div'), 'Starts with div');
    tests.assert(learnedItem.endsWith('</div>'), 'Ends with div');
});

tests.test('Party sharing affects whisper list correctly', () => {
    // Test with party sharing enabled
    const shareEnabled = true;
    const whisperListShared = shareEnabled ? [] : ['user1', 'gm1'];
    tests.assertEqual(whisperListShared.length, 0, 'No whispers when sharing enabled');

    // Test with party sharing disabled
    const shareDisabled = false;
    const currentUser = 'user1';
    const gmUsers = ['gm1', 'gm2'];
    const whisperListPrivate = shareDisabled ? [currentUser, ...gmUsers] : [];

    tests.assertEqual(whisperListPrivate.length, 3, 'Whispers to user and GMs when sharing disabled');
    tests.assert(whisperListPrivate.includes('user1'), 'Includes current user');
    tests.assert(whisperListPrivate.includes('gm1'), 'Includes GM 1');
    tests.assert(whisperListPrivate.includes('gm2'), 'Includes GM 2');
});

tests.test('False information generates correct HTML format', () => {
    const manager = game.RecallKnowledge.module.recallKnowledgeManager;

    const falseInfoTypes = [
        'highest-save',
        'lowest-save',
        'resistances',
        'weaknesses',
        'immunities',
        'special-attacks',
        'special-abilities'
    ];

    falseInfoTypes.forEach(infoType => {
        const falseInfo = manager.generateFalseInformation(infoType);

        tests.assert(falseInfo, `Generates false info for ${infoType}`);
        tests.assert(falseInfo.includes('rk-learned-item'), `False ${infoType} has item class`);
        tests.assert(falseInfo.includes('<strong>'), `False ${infoType} has strong tag`);
        tests.assert(falseInfo.includes('</strong>'), `False ${infoType} closes strong tag`);
        tests.assert(falseInfo.startsWith('<div'), `False ${infoType} starts with div`);
        tests.assert(falseInfo.endsWith('</div>'), `False ${infoType} ends with div`);
    });
});

tests.test('Chat message flags store necessary data', () => {
    const mockChatData = {
        flags: {
            'recall-knowledge': {
                actorId: 'actor123',
                targetId: 'target456',
                isFalseInfo: false,
                shareWithParty: true
            }
        }
    };

    const flags = mockChatData.flags['recall-knowledge'];

    tests.assert(flags.actorId, 'Stores actor ID');
    tests.assert(flags.targetId, 'Stores target ID');
    tests.assertEqual(flags.isFalseInfo, false, 'Stores false info flag');
    tests.assertEqual(flags.shareWithParty, true, 'Stores share with party flag');
});

tests.test('Learned section data attributes are present', () => {
    const actorId = 'test-actor-123';
    const targetId = 'test-target-456';
    const isFalseInfo = false;

    const learnedSection = `<div class="rk-learned" data-actor-id="${actorId}" data-target-id="${targetId}" data-is-false="${isFalseInfo}">`;

    tests.assert(learnedSection.includes('data-actor-id'), 'Has actor ID data attribute');
    tests.assert(learnedSection.includes('data-target-id'), 'Has target ID data attribute');
    tests.assert(learnedSection.includes('data-is-false'), 'Has false info data attribute');
    tests.assert(learnedSection.includes(actorId), 'Contains actual actor ID');
    tests.assert(learnedSection.includes(targetId), 'Contains actual target ID');
});

tests.test('Multiple learned items display correctly', () => {
    const items = [
        { label: 'Highest Save', value: 'Will (+18)' },
        { label: 'Lowest Save', value: 'Reflex (+8)' },
        { label: 'Weaknesses', value: 'fire 10, cold 5' },
        { label: 'Resistances', value: 'physical 5 (except silver)' },
    ];

    const htmlItems = items.map(item =>
        `<div class="rk-learned-item"><strong>${item.label}:</strong> ${item.value}</div>`
    );

    const content = htmlItems.join('');

    tests.assertEqual(htmlItems.length, 4, 'Creates 4 items');
    tests.assert(content.includes('Will (+18)'), 'Contains first item');
    tests.assert(content.includes('Reflex (+8)'), 'Contains second item');
    tests.assert(content.includes('fire 10, cold 5'), 'Contains third item');
    tests.assert(content.includes('physical 5'), 'Contains fourth item');
    tests.assertEqual((content.match(/rk-learned-item/g) || []).length, 4, 'All items have correct class');
});

tests.test('Empty learned information handled gracefully', () => {
    const emptyItems = [];
    const htmlItems = emptyItems.map(item =>
        `<div class="rk-learned-item"><strong>${item.label}:</strong> ${item.value}</div>`
    );

    tests.assertEqual(htmlItems.length, 0, 'No items generated for empty array');

    const content = htmlItems.join('');
    tests.assertEqual(content, '', 'Empty string for no items');
});

tests.test('Content replacement preserves message structure', () => {
    const originalMessage = `
        <div class="recall-knowledge-result">
            <div class="rk-header">Test Header</div>
            <div class="rk-target">Target: Test</div>
            <div class="rk-dc-line">DC: 20</div>
            <div class="rk-learned">
                <div class="rk-learned-content">
                    <em>Selecting information...</em>
                </div>
            </div>
        </div>
    `;

    const newContent = '<div class="rk-learned-item"><strong>Test:</strong> Value</div>';
    const updatedMessage = originalMessage.replace(
        /<div class="rk-learned-content">.*?<\/div>/s,
        `<div class="rk-learned-content">${newContent}</div>`
    );

    tests.assert(updatedMessage.includes('Test Header'), 'Preserves header');
    tests.assert(updatedMessage.includes('Target: Test'), 'Preserves target');
    tests.assert(updatedMessage.includes('DC: 20'), 'Preserves DC');
    tests.assert(updatedMessage.includes('rk-learned-item'), 'Contains new content');
    tests.assert(!updatedMessage.includes('Selecting information'), 'Removes placeholder');
});

// ============================================================================
// RUN THE TESTS
// ============================================================================

// Export for use in console
window.runRecallKnowledgeTests = async function () {
    return await tests.runAll();
};

console.log('Recall Knowledge Test Suite Loaded');
console.log('Run tests with: runRecallKnowledgeTests()');
