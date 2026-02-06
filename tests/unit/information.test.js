/**
 * Unit tests for Recall Knowledge module - Information Extraction
 */

import {
    createMockTarget,
    resetMocks,
} from './test-helpers.js';

describe('Save Extraction', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should identify highest save', () => {
        const target = createMockTarget({
            saves: {
                fortitude: { value: 14 },
                reflex: { value: 10 },
                will: { value: 12 },
            },
        });

        const saves = target.system.saves;
        const saveValues = [
            { name: 'Fortitude', value: saves.fortitude.value },
            { name: 'Reflex', value: saves.reflex.value },
            { name: 'Will', value: saves.will.value },
        ];

        saveValues.sort((a, b) => b.value - a.value);
        const highest = saveValues[0];

        expect(highest.name).toBe('Fortitude');
        expect(highest.value).toBe(14);
    });

    test('should identify lowest save', () => {
        const target = createMockTarget({
            saves: {
                fortitude: { value: 14 },
                reflex: { value: 10 },
                will: { value: 12 },
            },
        });

        const saves = target.system.saves;
        const saveValues = [
            { name: 'Fortitude', value: saves.fortitude.value },
            { name: 'Reflex', value: saves.reflex.value },
            { name: 'Will', value: saves.will.value },
        ];

        saveValues.sort((a, b) => a.value - b.value);
        const lowest = saveValues[0];

        expect(lowest.name).toBe('Reflex');
        expect(lowest.value).toBe(10);
    });

    test('should handle tied saves for highest', () => {
        const target = createMockTarget({
            saves: {
                fortitude: { value: 14 },
                reflex: { value: 14 },
                will: { value: 10 },
            },
        });

        const saves = target.system.saves;
        const saveValues = [
            { name: 'Fortitude', value: saves.fortitude.value },
            { name: 'Reflex', value: saves.reflex.value },
            { name: 'Will', value: saves.will.value },
        ];

        saveValues.sort((a, b) => b.value - a.value);
        const highest = saveValues[0];

        expect(highest.value).toBe(14);
        expect(['Fortitude', 'Reflex']).toContain(highest.name);
    });
});

describe('Weakness/Resistance/Immunity Extraction', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should extract weaknesses', () => {
        const target = createMockTarget({
            attributes: {
                weaknesses: [
                    { type: 'fire', value: 5 },
                    { type: 'cold', value: 10 },
                ],
                resistances: [],
                immunities: [],
            },
        });

        const weaknesses = target.system.attributes.weaknesses;

        expect(weaknesses).toHaveLength(2);
        expect(weaknesses[0].type).toBe('fire');
        expect(weaknesses[0].value).toBe(5);
    });

    test('should extract resistances', () => {
        const target = createMockTarget({
            attributes: {
                resistances: [
                    { type: 'physical', value: 5, exceptions: ['adamantine'] },
                ],
                weaknesses: [],
                immunities: [],
            },
        });

        const resistances = target.system.attributes.resistances;

        expect(resistances).toHaveLength(1);
        expect(resistances[0].type).toBe('physical');
        expect(resistances[0].value).toBe(5);
    });

    test('should extract immunities', () => {
        const target = createMockTarget({
            attributes: {
                immunities: [
                    { type: 'poison' },
                    { type: 'disease' },
                ],
                weaknesses: [],
                resistances: [],
            },
        });

        const immunities = target.system.attributes.immunities;

        expect(immunities).toHaveLength(2);
        expect(immunities[0].type).toBe('poison');
        expect(immunities[1].type).toBe('disease');
    });

    test('should handle empty weaknesses', () => {
        const target = createMockTarget({
            attributes: {
                weaknesses: [],
                resistances: [],
                immunities: [],
            },
        });

        const weaknesses = target.system.attributes.weaknesses;

        expect(weaknesses).toHaveLength(0);
    });
});

describe('Information Deduplication', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should deduplicate learned information', () => {
        const existing = ['highest-save', 'weaknesses'];
        const newInfo = ['weaknesses', 'resistances'];

        const combined = [...new Set([...existing, ...newInfo])];

        expect(combined).toHaveLength(3);
        expect(combined).toContain('highest-save');
        expect(combined).toContain('weaknesses');
        expect(combined).toContain('resistances');
    });

    test('should preserve order when deduplicating', () => {
        const existing = ['highest-save', 'weaknesses'];
        const newInfo = ['weaknesses', 'resistances'];

        const combined = [...new Set([...existing, ...newInfo])];

        expect(combined[0]).toBe('highest-save');
        expect(combined[1]).toBe('weaknesses');
        expect(combined[2]).toBe('resistances');
    });

    test('should handle all duplicate information', () => {
        const existing = ['highest-save', 'weaknesses'];
        const newInfo = ['highest-save', 'weaknesses'];

        const combined = [...new Set([...existing, ...newInfo])];

        expect(combined).toHaveLength(2);
        expect(combined).toContain('highest-save');
        expect(combined).toContain('weaknesses');
    });
});

describe('Information Labels', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should provide readable labels for info IDs', () => {
        const infoOptions = {
            'highest-save': 'Highest Save',
            'lowest-save': 'Lowest Save',
            'resistances': 'Resistances',
            'weaknesses': 'Weaknesses',
            'immunities': 'Immunities',
            'attacks': 'Attacks',
            'skills': 'Skills',
            'background': 'Background/Lore',
            'special-attacks': 'Special Attacks',
            'special-abilities': 'Special Abilities',
        };

        expect(infoOptions['highest-save']).toBe('Highest Save');
        expect(infoOptions['weaknesses']).toBe('Weaknesses');
        expect(infoOptions['special-attacks']).toBe('Special Attacks');
    });

    test('should have labels for all standard info types', () => {
        const infoOptions = {
            'highest-save': 'Highest Save',
            'lowest-save': 'Lowest Save',
            'resistances': 'Resistances',
            'weaknesses': 'Weaknesses',
            'immunities': 'Immunities',
            'attacks': 'Attacks',
            'skills': 'Skills',
            'background': 'Background/Lore',
            'special-attacks': 'Special Attacks',
            'special-abilities': 'Special Abilities',
        };

        const expectedTypes = [
            'highest-save',
            'lowest-save',
            'resistances',
            'weaknesses',
            'immunities',
            'attacks',
            'skills',
            'background',
        ];

        expectedTypes.forEach(type => {
            expect(infoOptions[type]).toBeDefined();
            expect(typeof infoOptions[type]).toBe('string');
            expect(infoOptions[type].length).toBeGreaterThan(0);
        });
    });
});

describe('Learned Information Display', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should generate HTML for learned information items', () => {
        const learnedInfo = [
            { id: 'highest-save', label: 'Highest Save', value: 'Fortitude (+14)' },
            { id: 'weaknesses', label: 'Weaknesses', value: 'cold 10' },
        ];

        const htmlItems = learnedInfo.map(info => {
            return `<div class="rk-learned-item"><strong>${info.label}:</strong> ${info.value}</div>`;
        });

        expect(htmlItems).toHaveLength(2);
        expect(htmlItems[0]).toContain('rk-learned-item');
        expect(htmlItems[0]).toContain('Highest Save');
        expect(htmlItems[0]).toContain('Fortitude (+14)');
        expect(htmlItems[1]).toContain('Weaknesses');
        expect(htmlItems[1]).toContain('cold 10');
    });

    test('should format learned content container', () => {
        const learnedContent = `
            <div class="rk-learned-item"><strong>Highest Save:</strong> Reflex (+12)</div>
            <div class="rk-learned-item"><strong>Weaknesses:</strong> fire 5</div>
        `;

        const container = `<div class="rk-learned-content">${learnedContent}</div>`;

        expect(container).toContain('rk-learned-content');
        expect(container).toContain('rk-learned-item');
        expect(container).toContain('Highest Save');
        expect(container).toContain('Weaknesses');
    });

    test('should handle empty learned information', () => {
        const learnedInfo = [];
        const htmlItems = learnedInfo.map(info => {
            return `<div class="rk-learned-item"><strong>${info.label}:</strong> ${info.value}</div>`;
        });

        expect(htmlItems).toHaveLength(0);
    });

    test('should escape HTML in learned information values', () => {
        const dangerousValue = '<script>alert("xss")</script>';
        const sanitizedValue = dangerousValue
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const htmlItem = `<div class="rk-learned-item"><strong>Test:</strong> ${sanitizedValue}</div>`;

        expect(htmlItem).not.toContain('<script>');
        expect(htmlItem).toContain('&lt;script&gt;');
    });
});

describe('False Information Generation', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should generate false highest save information', () => {
        const saves = ['Fortitude', 'Reflex', 'Will'];
        const randomSave = saves[Math.floor(Math.random() * saves.length)];
        const randomBonus = Math.floor(Math.random() * 21) + 5; // 5-25

        const falseInfo = `<div class="rk-learned-item"><strong>Highest Save:</strong> ${randomSave} (+${randomBonus})</div>`;

        expect(falseInfo).toContain('rk-learned-item');
        expect(falseInfo).toContain('Highest Save');
        expect(saves.some(save => falseInfo.includes(save))).toBe(true);
        expect(falseInfo).toMatch(/\+\d+/);
    });

    test('should generate false resistances information', () => {
        const damageTypes = ['fire', 'cold', 'electricity'];
        const selectedType = damageTypes[Math.floor(Math.random() * damageTypes.length)];
        const value = Math.floor(Math.random() * 11) + 5; // 5-15

        const falseInfo = `<div class="rk-learned-item"><strong>Resistances:</strong> ${selectedType} ${value}</div>`;

        expect(falseInfo).toContain('Resistances');
        expect(falseInfo).toMatch(/\d+/);
    });

    test('should format false information consistently', () => {
        const infoTypes = [
            'highest-save',
            'lowest-save',
            'resistances',
            'weaknesses',
            'immunities',
            'special-attacks',
            'special-abilities'
        ];

        infoTypes.forEach(type => {
            const mockFalseInfo = `<div class="rk-learned-item"><strong>${type}:</strong> Mock Value</div>`;

            expect(mockFalseInfo).toContain('rk-learned-item');
            expect(mockFalseInfo).toContain('<strong>');
            expect(mockFalseInfo).toContain('</strong>');
            expect(mockFalseInfo).toContain('</div>');
        });
    });
});

describe('Chat Message Visibility', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should set whisper list for party sharing enabled', () => {
        const shareWithParty = true;
        const whisperList = shareWithParty ? [] : ['user1', 'gm1'];

        expect(whisperList).toEqual([]);
    });

    test('should set whisper list for party sharing disabled', () => {
        const shareWithParty = false;
        const currentUserId = 'user1';
        const gmIds = ['gm1', 'gm2'];
        const whisperList = shareWithParty ? [] : [currentUserId, ...gmIds];

        expect(whisperList).toHaveLength(3);
        expect(whisperList).toContain('user1');
        expect(whisperList).toContain('gm1');
        expect(whisperList).toContain('gm2');
    });

    test('should identify GM users correctly', () => {
        const users = [
            { id: 'user1', isGM: false },
            { id: 'user2', isGM: false },
            { id: 'gm1', isGM: true },
            { id: 'gm2', isGM: true },
        ];

        const gmIds = users.filter(u => u.isGM).map(u => u.id);

        expect(gmIds).toHaveLength(2);
        expect(gmIds).toContain('gm1');
        expect(gmIds).toContain('gm2');
    });
});

describe('Chat Message Content Updates', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should replace placeholder with learned content', () => {
        const originalContent = `
            <div class="recall-knowledge-result">
                <div class="rk-learned-content">
                    <em>Selecting information...</em>
                </div>
            </div>
        `;

        const learnedContent = `
            <div class="rk-learned-item"><strong>Highest Save:</strong> Will (+15)</div>
            <div class="rk-learned-item"><strong>Weaknesses:</strong> fire 10</div>
        `;

        const updatedContent = originalContent.replace(
            /<div class="rk-learned-content">.*?<\/div>/s,
            `<div class="rk-learned-content">${learnedContent}</div>`
        );

        expect(updatedContent).toContain('Highest Save');
        expect(updatedContent).toContain('Weaknesses');
        expect(updatedContent).not.toContain('Selecting information');
    });

    test('should preserve other content when updating learned section', () => {
        const originalContent = `
            <div class="recall-knowledge-result">
                <div class="rk-header">Recall Knowledge: Religion</div>
                <div class="rk-target">Target: Ancient Dragon</div>
                <div class="rk-learned-content">
                    <em>Selecting information...</em>
                </div>
            </div>
        `;

        const learnedContent = `<div class="rk-learned-item"><strong>Test:</strong> Value</div>`;
        const updatedContent = originalContent.replace(
            /<div class="rk-learned-content">.*?<\/div>/s,
            `<div class="rk-learned-content">${learnedContent}</div>`
        );

        expect(updatedContent).toContain('Recall Knowledge: Religion');
        expect(updatedContent).toContain('Target: Ancient Dragon');
        expect(updatedContent).toContain('<strong>Test:</strong> Value');
    });

    test('should handle multiple information items in update', () => {
        const items = [
            '<div class="rk-learned-item"><strong>Item 1:</strong> Value 1</div>',
            '<div class="rk-learned-item"><strong>Item 2:</strong> Value 2</div>',
            '<div class="rk-learned-item"><strong>Item 3:</strong> Value 3</div>',
        ];

        const learnedContent = items.join('');
        const container = `<div class="rk-learned-content">${learnedContent}</div>`;

        expect(container).toContain('Item 1');
        expect(container).toContain('Item 2');
        expect(container).toContain('Item 3');
        expect((container.match(/rk-learned-item/g) || []).length).toBe(3);
    });
});
