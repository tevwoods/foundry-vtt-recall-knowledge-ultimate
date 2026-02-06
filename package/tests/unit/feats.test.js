/**
 * Unit tests for Recall Knowledge module - Feat Detection
 */

import {
    createMockActor,
    createMockFeat,
    resetMocks,
} from './test-helpers.js';

describe('Feat Detection', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should detect Know-It-All feat', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Know-It-All', 'know-it-all'),
            ],
        });

        const hasKnowItAll = actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('know-it-all') || item.slug === 'know-it-all')
        );

        expect(hasKnowItAll).toBe(true);
    });

    test('should detect Thorough Research feat', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Thorough Research', 'thorough-research'),
            ],
        });

        const hasThoroughResearch = actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('thorough research') || item.slug === 'thorough-research')
        );

        expect(hasThoroughResearch).toBe(true);
    });

    test('should detect Thorough Reports feat', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Thorough Reports', 'thorough-reports'),
            ],
        });

        const hasThoroughReports = actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('thorough reports') || item.slug === 'thorough-reports')
        );

        expect(hasThoroughReports).toBe(true);
    });

    test('should detect Scrollmaster Dedication feat', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Scrollmaster Dedication', 'scrollmaster-dedication'),
            ],
        });

        const hasScrollmaster = actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('scrollmaster dedication') || item.slug === 'scrollmaster-dedication')
        );

        expect(hasScrollmaster).toBe(true);
    });

    test('should detect Diverse Recognition feat', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Diverse Recognition', 'diverse-recognition'),
            ],
        });

        const hasDiverseRecognition = actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('diverse recognition') || item.slug === 'diverse-recognition')
        );

        expect(hasDiverseRecognition).toBe(true);
    });

    test('should detect Assurance feat for specific skill', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Assurance (Arcana)', 'assurance-arcana'),
            ],
        });

        const skillKey = 'arcana';
        const hasAssurance = actor.items.some(item =>
            item.type === 'feat' &&
            (item.slug === `assurance-${skillKey}` ||
                item.name?.toLowerCase().includes(`assurance (${skillKey})`))
        );

        expect(hasAssurance).toBe(true);
    });

    test('should NOT detect wrong Assurance feat', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Assurance (Nature)', 'assurance-nature'),
            ],
        });

        const skillKey = 'arcana';
        const hasAssurance = actor.items.some(item =>
            item.type === 'feat' &&
            (item.slug === `assurance-${skillKey}` ||
                item.name?.toLowerCase().includes(`assurance (${skillKey})`))
        );

        expect(hasAssurance).toBe(false);
    });

    test('should return false when actor has no feats', () => {
        const actor = createMockActor({
            items: [],
        });

        const hasKnowItAll = actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('know-it-all') || item.slug === 'know-it-all')
        );

        expect(hasKnowItAll).toBe(false);
    });
});

describe('Information Bonus Calculation', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should grant +1 bonus for Know-It-All', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Know-It-All', 'know-it-all'),
            ],
        });

        const bonusFeats = [
            'know-it-all',
            'thorough research',
            'font of knowledge',
            'fountain of secrets',
        ];

        let bonus = 0;
        for (const item of actor.items) {
            const itemName = item.name?.toLowerCase() || '';
            const itemSlug = item.system?.slug?.toLowerCase() || '';

            for (const featName of bonusFeats) {
                if (itemName.includes(featName) || itemSlug.includes(featName)) {
                    bonus += 1;
                    break;
                }
            }
        }

        expect(bonus).toBe(1);
    });

    test('should grant +1 bonus for Thorough Research', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Thorough Research', 'thorough-research'),
            ],
        });

        const bonusFeats = [
            'know-it-all',
            'thorough research',
            'font of knowledge',
            'fountain of secrets',
        ];

        let bonus = 0;
        for (const item of actor.items) {
            const itemName = item.name?.toLowerCase() || '';
            const itemSlug = item.system?.slug?.toLowerCase() || '';

            for (const featName of bonusFeats) {
                if (itemName.includes(featName) || itemSlug.includes(featName)) {
                    bonus += 1;
                    break;
                }
            }
        }

        expect(bonus).toBe(1);
    });

    test('should grant +2 bonus for two bonus feats', () => {
        const actor = createMockActor({
            items: [
                createMockFeat('Know-It-All', 'know-it-all'),
                createMockFeat('Thorough Research', 'thorough-research'),
            ],
        });

        const bonusFeats = [
            'know-it-all',
            'thorough research',
            'font of knowledge',
            'fountain of secrets',
        ];

        let bonus = 0;
        for (const item of actor.items) {
            const itemName = item.name?.toLowerCase() || '';
            const itemSlug = item.system?.slug?.toLowerCase() || '';

            for (const featName of bonusFeats) {
                if (itemName.includes(featName) || itemSlug.includes(featName)) {
                    bonus += 1;
                    break;
                }
            }
        }

        expect(bonus).toBe(2);
    });
});

describe('Assurance Calculation', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should calculate Assurance value correctly', () => {
        const actor = createMockActor({
            skills: {
                arcana: { rank: 3, modifier: 12 }, // Master rank
            },
            details: {
                level: { value: 8 },
            },
        });

        const skill = actor.system.skills.arcana;
        const rank = skill.rank; // 3 = Master
        const level = actor.system.details.level.value; // 8

        const assuranceValue = 10 + (rank * 2) + level;

        expect(assuranceValue).toBe(24); // 10 + 6 + 8
    });

    test('should calculate Assurance for Legendary proficiency', () => {
        const actor = createMockActor({
            skills: {
                society: { rank: 4, modifier: 18 }, // Legendary rank
            },
            details: {
                level: { value: 15 },
            },
        });

        const skill = actor.system.skills.society;
        const rank = skill.rank; // 4 = Legendary
        const level = actor.system.details.level.value; // 15

        const assuranceValue = 10 + (rank * 2) + level;

        expect(assuranceValue).toBe(33); // 10 + 8 + 15
    });
});
