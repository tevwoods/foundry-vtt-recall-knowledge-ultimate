/**
 * Module Settings Management
 * Handles all configuration settings for the Recall Knowledge module
 */

import { MODULE_ID } from '../constants';

export class RecallKnowledgeSettings {

    /**
     * Register all module settings
     */
    public async register(): Promise<void> {
        console.log(`${MODULE_ID} | Registering module settings`);

        // Enable/Disable Rules Engine
        game.settings.register(MODULE_ID, 'enableRulesEngine', {
            name: 'recall-knowledge.settings.enableRulesEngine.name',
            hint: 'recall-knowledge.settings.enableRulesEngine.hint',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
            requiresReload: true
        });

        // Rules Engine Debug Mode
        game.settings.register(MODULE_ID, 'debugMode', {
            name: 'recall-knowledge.settings.debugMode.name',
            hint: 'recall-knowledge.settings.debugMode.hint',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        // Knowledge Check Auto-Roll
        game.settings.register(MODULE_ID, 'autoRollKnowledge', {
            name: 'recall-knowledge.settings.autoRollKnowledge.name',
            hint: 'recall-knowledge.settings.autoRollKnowledge.hint',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        // Maximum Knowledge Attempts
        game.settings.register(MODULE_ID, 'maxKnowledgeAttempts', {
            name: 'recall-knowledge.settings.maxKnowledgeAttempts.name',
            hint: 'recall-knowledge.settings.maxKnowledgeAttempts.hint',
            scope: 'world',
            config: true,
            type: Number,
            default: 1,
            range: {
                min: 1,
                max: 10,
                step: 1
            }
        });

        // Chat Output Style
        game.settings.register(MODULE_ID, 'chatOutputStyle', {
            name: 'recall-knowledge.settings.chatOutputStyle.name',
            hint: 'recall-knowledge.settings.chatOutputStyle.hint',
            scope: 'world',
            config: true,
            type: String,
            default: 'detailed',
            choices: {
                'simple': 'recall-knowledge.settings.chatOutputStyle.simple',
                'detailed': 'recall-knowledge.settings.chatOutputStyle.detailed',
                'whisper': 'recall-knowledge.settings.chatOutputStyle.whisper'
            }
        });

        // GM Approval Required
        game.settings.register(MODULE_ID, 'requireGMApproval', {
            name: 'recall-knowledge.settings.requireGMApproval.name',
            hint: 'recall-knowledge.settings.requireGMApproval.hint',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        // Creature Information Settings
        game.settings.register(MODULE_ID, 'revealableInfo', {
            name: 'recall-knowledge.settings.revealableInfo.name',
            hint: 'recall-knowledge.settings.revealableInfo.hint',
            scope: 'world',
            config: true,
            type: Object,
            default: {
                basicInfo: { visible: true, gmOnly: false }, // Name, type, size
                abilities: { visible: true, gmOnly: false }, // Abilities and scores
                skills: { visible: true, gmOnly: true }, // Skill bonuses
                saves: { visible: true, gmOnly: false }, // Saving throws
                ac: { visible: true, gmOnly: false }, // Armor class
                hp: { visible: false, gmOnly: true }, // Hit points
                resistances: { visible: true, gmOnly: false }, // Resistances/immunities
                weaknesses: { visible: true, gmOnly: false }, // Weaknesses
                attacks: { visible: true, gmOnly: true }, // Attack bonuses
                spells: { visible: true, gmOnly: true }, // Spell information
                traits: { visible: true, gmOnly: false }, // Creature traits
                lore: { visible: true, gmOnly: false } // Lore and background
            }
        });

        // Auto-calculate DC
        game.settings.register(MODULE_ID, 'autoCalculateDC', {
            name: 'recall-knowledge.settings.autoCalculateDC.name',
            hint: 'recall-knowledge.settings.autoCalculateDC.hint',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        // DC Calculation Method
        game.settings.register(MODULE_ID, 'dcCalculationMethod', {
            name: 'recall-knowledge.settings.dcCalculationMethod.name',
            hint: 'recall-knowledge.settings.dcCalculationMethod.hint',
            scope: 'world',
            config: true,
            type: String,
            default: 'level',
            choices: {
                'level': 'recall-knowledge.settings.dcCalculationMethod.level',
                'cr': 'recall-knowledge.settings.dcCalculationMethod.cr',
                'custom': 'recall-knowledge.settings.dcCalculationMethod.custom'
            }
        });

        // Include Lore Skills
        game.settings.register(MODULE_ID, 'includeLoreSkills', {
            name: 'recall-knowledge.settings.includeLoreSkills.name',
            hint: 'recall-knowledge.settings.includeLoreSkills.hint',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });
    }    /**
     * Get a setting value
     */
    public getSetting(key: string): unknown {
        return game.settings.get(MODULE_ID, key);
    }

    /**
     * Set a setting value
     */
    public async setSetting(key: string, value: unknown): Promise<unknown> {
        return game.settings.set(MODULE_ID, key, value);
    }

    /**
     * Check if rules engine is enabled
     */
    public isRulesEngineEnabled(): boolean {
        return this.getSetting('enableRulesEngine') as boolean;
    }

    /**
     * Check if debug mode is enabled
     */
    public isDebugMode(): boolean {
        return this.getSetting('debugMode') as boolean;
    }

    /**
     * Check if GM approval is required for recall knowledge checks
     */
    public requiresGMApproval(): boolean {
        return this.getSetting('requireGMApproval') as boolean;
    }

    /**
     * Get revealable information settings
     */
    public getRevealableInfo(): any {
        return this.getSetting('revealableInfo') as any;
    }

    /**
     * Check if DC should be auto-calculated
     */
    public shouldAutoCalculateDC(): boolean {
        return this.getSetting('autoCalculateDC') as boolean;
    }

    /**
     * Get DC calculation method
     */
    public getDCCalculationMethod(): string {
        return this.getSetting('dcCalculationMethod') as string;
    }

    /**
     * Check if lore skills should be included
     */
    public shouldIncludeLoreSkills(): boolean {
        return this.getSetting('includeLoreSkills') as boolean;
    }
}