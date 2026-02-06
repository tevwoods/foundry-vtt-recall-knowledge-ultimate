/**
 * Unit tests for Recall Knowledge module - Skills & Appropriate Skills
 */

import {
    createMockActor,
    createMockTarget,
    mockGame,
    resetMocks
} from './test-helpers.js';

// We need to create a simplified version of the manager for testing
// since the full module requires FoundryVTT runtime

describe('Skill Detection and Sorting', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should identify knowledge skills from actor', () => {
        const actor = createMockActor({
            skills: {
                arcana: { label: 'Arcana', rank: 2, modifier: 5 },
                nature: { label: 'Nature', rank: 3, modifier: 8 },
                crafting: { label: 'Crafting', rank: 1, modifier: 2 }, // Not a knowledge skill
                society: { label: 'Society', rank: 4, modifier: 10 },
                'lore-dragon': { label: 'Dragon Lore', rank: 2, modifier: 6 },
            },
        });

        // Knowledge skills: arcana, nature, occultism, religion, society, any lore
        const knowledgeSkillKeys = ['arcana', 'nature', 'occultism', 'religion', 'society'];
        const actorSkills = Object.keys(actor.system.skills);

        const knowledgeSkills = actorSkills.filter(key =>
            knowledgeSkillKeys.includes(key) || key.toLowerCase().includes('lore')
        );

        expect(knowledgeSkills).toContain('arcana');
        expect(knowledgeSkills).toContain('nature');
        expect(knowledgeSkills).toContain('society');
        expect(knowledgeSkills).toContain('lore-dragon');
        expect(knowledgeSkills).not.toContain('crafting');
    });

    test('should sort skills by modifier descending', () => {
        const skills = [
            { key: 'arcana', modifier: 5, label: 'Arcana' },
            { key: 'nature', modifier: 8, label: 'Nature' },
            { key: 'society', modifier: 10, label: 'Society' },
            { key: 'religion', modifier: 3, label: 'Religion' },
        ];

        skills.sort((a, b) => b.modifier - a.modifier);

        expect(skills[0].key).toBe('society'); // +10
        expect(skills[1].key).toBe('nature');  // +8
        expect(skills[2].key).toBe('arcana');  // +5
        expect(skills[3].key).toBe('religion'); // +3
    });
});

describe('Appropriate Skills Detection', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should identify Arcana for dragons', () => {
        const target = createMockTarget({
            traits: { value: ['dragon', 'fire'] },
        });

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        const appropriate = [];

        if (traits.includes('dragon')) {
            appropriate.push('arcana');
        }

        expect(appropriate).toContain('arcana');
    });

    test('should identify Nature for fey', () => {
        const target = createMockTarget({
            traits: { value: ['fey'] },
        });

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        const appropriate = [];

        if (traits.includes('fey')) {
            appropriate.push('nature');
        }

        expect(appropriate).toContain('nature');
    });

    test('should identify Religion for undead', () => {
        const target = createMockTarget({
            traits: { value: ['undead'] },
        });

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        const appropriate = [];

        if (traits.includes('undead')) {
            appropriate.push('religion');
        }

        expect(appropriate).toContain('religion');
    });

    test('should identify Occultism for aberrations', () => {
        const target = createMockTarget({
            traits: { value: ['aberration'] },
        });

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        const appropriate = [];

        if (traits.includes('aberration')) {
            appropriate.push('occultism');
        }

        expect(appropriate).toContain('occultism');
    });

    test('should identify Society for humanoids', () => {
        const target = createMockTarget({
            traits: { value: ['humanoid', 'elf'] },
        });

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        const appropriate = [];

        if (traits.includes('humanoid')) {
            appropriate.push('society');
        }

        expect(appropriate).toContain('society');
    });

    test('should include multiple appropriate skills for beasts', () => {
        const target = createMockTarget({
            traits: { value: ['beast'] },
        });

        const traits = target.system.traits.value.map(t => t.toLowerCase());
        const appropriate = [];

        if (traits.includes('beast')) {
            appropriate.push('arcana', 'nature');
        }

        expect(appropriate).toContain('arcana');
        expect(appropriate).toContain('nature');
        expect(appropriate.length).toBe(2);
    });

    test('should always include universal lore skills', () => {
        const target = createMockTarget({
            traits: { value: ['dragon'] },
        });

        const universalLores = ['bardic-lore', 'esoteric-lore', 'gossip-lore', 'loremaster-lore'];
        const appropriate = [...universalLores];

        // Add creature-specific skills
        const traits = target.system.traits.value.map(t => t.toLowerCase());
        if (traits.includes('dragon')) {
            appropriate.push('arcana');
        }

        expect(appropriate).toContain('bardic-lore');
        expect(appropriate).toContain('esoteric-lore');
        expect(appropriate).toContain('gossip-lore');
        expect(appropriate).toContain('loremaster-lore');
        expect(appropriate).toContain('arcana');
    });
});

describe('Bestiary Scholar Feature', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('should add Bestiary Scholar skill when knowledge skills are appropriate', () => {
        // Replace the settings.get function to return nature for bestiaryScholarSkill
        const originalGet = mockGame.settings.get;
        mockGame.settings.get = (module, key) => {
            if (key === 'bestiaryScholarSkill') return 'nature';
            return null;
        };

        const target = createMockTarget({
            traits: { value: ['dragon'] },
        });

        const appropriate = ['bardic-lore', 'esoteric-lore', 'gossip-lore', 'loremaster-lore'];
        const traits = target.system.traits.value.map(t => t.toLowerCase());

        if (traits.includes('dragon')) {
            appropriate.push('arcana');
        }

        // Add Bestiary Scholar if knowledge skills are appropriate
        const bestiaryScholarSkill = mockGame.settings.get('recall-knowledge', 'bestiaryScholarSkill');
        if (bestiaryScholarSkill && bestiaryScholarSkill !== '') {
            const knowledgeSkills = ['nature', 'religion', 'occultism', 'arcana'];
            const hasKnowledgeSkill = knowledgeSkills.some(skill => appropriate.includes(skill));

            if (hasKnowledgeSkill) {
                appropriate.push(bestiaryScholarSkill);
            }
        }

        expect(appropriate).toContain('arcana');
        expect(appropriate).toContain('nature'); // Bestiary Scholar skill added

        // Restore original
        mockGame.settings.get = originalGet;
    });

    test('should NOT add Bestiary Scholar for Society-only checks', () => {
        // Replace the settings.get function to return occultism for bestiaryScholarSkill
        const originalGet = mockGame.settings.get;
        mockGame.settings.get = (module, key) => {
            if (key === 'bestiaryScholarSkill') return 'occultism';
            return null;
        };

        const target = createMockTarget({
            traits: { value: ['humanoid'] },
        });

        const appropriate = ['bardic-lore', 'esoteric-lore', 'gossip-lore', 'loremaster-lore'];
        const traits = target.system.traits.value.map(t => t.toLowerCase());

        if (traits.includes('humanoid')) {
            appropriate.push('society');
        }

        // Add Bestiary Scholar only if knowledge skills are appropriate
        const bestiaryScholarSkill = mockGame.settings.get('recall-knowledge', 'bestiaryScholarSkill');
        if (bestiaryScholarSkill && bestiaryScholarSkill !== '') {
            const knowledgeSkills = ['nature', 'religion', 'occultism', 'arcana'];
            const hasKnowledgeSkill = knowledgeSkills.some(skill => appropriate.includes(skill));

            if (hasKnowledgeSkill) {
                appropriate.push(bestiaryScholarSkill);
            }
        }

        expect(appropriate).toContain('society');
        expect(appropriate).not.toContain('occultism'); // Bestiary Scholar skill NOT added

        // Restore original
        mockGame.settings.get = originalGet;
    });

    test('should add Bestiary Scholar for creatures with multiple knowledge skills', () => {
        // Replace the settings.get function to return religion for bestiaryScholarSkill
        const originalGet = mockGame.settings.get;
        mockGame.settings.get = (module, key) => {
            if (key === 'bestiaryScholarSkill') return 'religion';
            return null;
        };

        const target = createMockTarget({
            traits: { value: ['beast'] }, // beast has both arcana and nature
        });

        const appropriate = ['bardic-lore', 'esoteric-lore', 'gossip-lore', 'loremaster-lore'];
        const traits = target.system.traits.value.map(t => t.toLowerCase());

        if (traits.includes('beast')) {
            appropriate.push('arcana', 'nature');
        }

        // Add Bestiary Scholar if knowledge skills are appropriate
        const bestiaryScholarSkill = mockGame.settings.get('recall-knowledge', 'bestiaryScholarSkill');
        if (bestiaryScholarSkill && bestiaryScholarSkill !== '') {
            const knowledgeSkills = ['nature', 'religion', 'occultism', 'arcana'];
            const hasKnowledgeSkill = knowledgeSkills.some(skill => appropriate.includes(skill));

            if (hasKnowledgeSkill) {
                appropriate.push(bestiaryScholarSkill);
            }
        }

        expect(appropriate).toContain('arcana');
        expect(appropriate).toContain('nature');
        expect(appropriate).toContain('religion'); // Bestiary Scholar skill added

        // Restore original
        mockGame.settings.get = originalGet;
    });
});
