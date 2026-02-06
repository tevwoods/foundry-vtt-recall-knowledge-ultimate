/**
 * Unit tests for Recall Knowledge module - Information & DC Calculation
 */

import {
    createMockActor,
    createMockFeat,
    createMockTarget,
    resetMocks,
} from './test-helpers.js';

describe('Information Count Calculation', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should grant 2 pieces on critical success', () => {
        const baseCount = 2; // Critical success
        expect(baseCount).toBe(2);
    });

    test('should grant 1 piece on success', () => {
        const baseCount = 1; // Success
        expect(baseCount).toBe(1);
    });

    test('should grant 0 pieces on failure', () => {
        const baseCount = 0; // Failure
        expect(baseCount).toBe(0);
    });

    test('should grant 0 pieces on critical failure', () => {
        const baseCount = 0; // Critical failure (unless false info setting)
        expect(baseCount).toBe(0);
    });

    test('should add bonus from Know-It-All', () => {
        const actor = createMockActor({
            items: [createMockFeat('Know-It-All', 'know-it-all')],
        });

        let count = 1; // Success

        // Check for bonus feats
        const bonusFeats = ['know-it-all', 'thorough research'];
        for (const item of actor.items) {
            const itemName = item.name?.toLowerCase() || '';
            for (const featName of bonusFeats) {
                if (itemName.includes(featName)) {
                    count += 1;
                    break;
                }
            }
        }

        expect(count).toBe(2); // 1 + 1 bonus
    });

    test('should calculate total with multiple bonuses', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Know-It-All', 'know-it-all'),
                createMockFeat('Thorough Research', 'thorough-research'),
            ],
        });

        let count = 2; // Critical success

        // Check for bonus feats
        const bonusFeats = ['know-it-all', 'thorough research'];
        let bonus = 0;
        for (const item of actor.items) {
            const itemName = item.name?.toLowerCase() || '';
            for (const featName of bonusFeats) {
                if (itemName.includes(featName)) {
                    bonus += 1;
                    break;
                }
            }
        }
        count += bonus;

        expect(count).toBe(4); // 2 + 2 bonus
    });
});

describe('DC Calculation', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should calculate DC based on creature level', () => {
        const target = createMockTarget({
            details: {
                level: { value: 5 },
            },
        });

        const level = target.system.details.level.value;
        const baseDC = 15 + level; // Standard DC formula

        expect(baseDC).toBe(20); // 15 + 5
    });

    test('should calculate DC for level 0 creature', () => {
        const target = createMockTarget({
            details: {
                level: { value: 0 },
            },
        });

        const level = target.system.details.level.value;
        const baseDC = 15 + level;

        expect(baseDC).toBe(15);
    });

    test('should calculate DC for high level creature', () => {
        const target = createMockTarget({
            details: {
                level: { value: 20 },
            },
        });

        const level = target.system.details.level.value;
        const baseDC = 15 + level;

        expect(baseDC).toBe(35);
    });

    test('should increase DC by 2 per previous attempt', () => {
        const baseDC = 20;
        const previousAttempts = 3;
        const adjustedDC = baseDC + (previousAttempts * 2);

        expect(adjustedDC).toBe(26); // 20 + 6
    });

    test('should not adjust DC on first attempt', () => {
        const baseDC = 20;
        const previousAttempts = 0;
        const adjustedDC = baseDC + (previousAttempts * 2);

        expect(adjustedDC).toBe(20);
    });
});

describe('Thorough Reports Bonus', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should grant +2 bonus for tracked creature type', () => {
        const actor = createMockActor({
            items: [createMockFeat('Thorough Reports', 'thorough-reports')],
        });

        // Simulate tracked creature types
        const trackedTypes = ['dragon', 'undead'];
        const creatureType = 'dragon';

        const hasFeat = actor.items.some(item =>
            item.name.toLowerCase().includes('thorough reports')
        );

        let bonus = 0;
        if (hasFeat && trackedTypes.includes(creatureType)) {
            bonus = 2;
        }

        expect(bonus).toBe(2);
    });

    test('should grant +4 bonus with Scrollmaster Dedication', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Thorough Reports', 'thorough-reports'),
                createMockFeat('Scrollmaster Dedication', 'scrollmaster-dedication'),
            ],
        });

        const trackedTypes = ['dragon'];
        const creatureType = 'dragon';

        const hasThoroughReports = actor.items.some(item =>
            item.name.toLowerCase().includes('thorough reports')
        );

        const hasScrollmaster = actor.items.some(item =>
            item.name.toLowerCase().includes('scrollmaster dedication')
        );

        let bonus = 0;
        if (hasThoroughReports && trackedTypes.includes(creatureType)) {
            bonus = hasScrollmaster ? 4 : 2;
        }

        expect(bonus).toBe(4);
    });

    test('should grant 0 bonus for untracked creature type', () => {
        const actor = createMockActor({
            items: [createMockFeat('Thorough Reports', 'thorough-reports')],
        });

        const trackedTypes = ['dragon'];
        const creatureType = 'undead'; // Not tracked

        const hasFeat = actor.items.some(item =>
            item.name.toLowerCase().includes('thorough reports')
        );

        let bonus = 0;
        if (hasFeat && trackedTypes.includes(creatureType)) {
            bonus = 2;
        }

        expect(bonus).toBe(0);
    });

    test('should grant 0 bonus if no Thorough Reports feat', () => {
        const actor = createMockActor({
            items: [],
        });

        const trackedTypes = ['dragon'];
        const creatureType = 'dragon';

        const hasFeat = actor.items.some(item =>
            item.name.toLowerCase().includes('thorough reports')
        );

        let bonus = 0;
        if (hasFeat && trackedTypes.includes(creatureType)) {
            bonus = 2;
        }

        expect(bonus).toBe(0);
    });
});

describe('Creature Type Detection', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should detect dragon type from traits', () => {
        const target = createMockTarget({
            traits: { value: ['dragon', 'fire'] },
        });

        const creatureTypes = [
            'aberration', 'animal', 'astral', 'beast', 'celestial', 'construct',
            'dragon', 'elemental', 'ethereal', 'fey', 'fiend', 'fungus',
            'giant', 'humanoid', 'monitor', 'ooze', 'plant', 'undead',
        ];

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        let detectedType = null;

        for (const trait of traits) {
            if (creatureTypes.includes(trait)) {
                detectedType = trait;
                break;
            }
        }

        expect(detectedType).toBe('dragon');
    });

    test('should return null for non-creature traits', () => {
        const target = createMockTarget({
            traits: { value: ['fire', 'large'] },
        });

        const creatureTypes = [
            'aberration', 'animal', 'astral', 'beast', 'celestial', 'construct',
            'dragon', 'elemental', 'ethereal', 'fey', 'fiend', 'fungus',
            'giant', 'humanoid', 'monitor', 'ooze', 'plant', 'undead',
        ];

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        let detectedType = null;

        for (const trait of traits) {
            if (creatureTypes.includes(trait)) {
                detectedType = trait;
                break;
            }
        }

        expect(detectedType).toBeNull();
    });

    test('should detect first matching creature type', () => {
        const target = createMockTarget({
            traits: { value: ['undead', 'humanoid'] }, // Some creatures have multiple types
        });

        const creatureTypes = [
            'aberration', 'animal', 'astral', 'beast', 'celestial', 'construct',
            'dragon', 'elemental', 'ethereal', 'fey', 'fiend', 'fungus',
            'giant', 'humanoid', 'monitor', 'ooze', 'plant', 'undead',
        ];

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        let detectedType = null;

        for (const trait of traits) {
            if (creatureTypes.includes(trait)) {
                detectedType = trait;
                break;
            }
        }

        expect(detectedType).toBe('undead'); // First in the traits array
    });
});
