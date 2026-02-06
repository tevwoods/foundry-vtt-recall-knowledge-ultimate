/**
 * Module API for Recall Knowledge
 * Provides external API for other modules and macros to interact with
 */

import { MODULE_ID } from '../constants';
import { KnowledgeRuleElement, ModifierRuleElement, RuleElement, RulesEngine } from './rules-engine';
import { RecallKnowledgeSettings } from './settings';
import { SocketHandler } from './socket';

/**
 * API interface for external access
 */
export interface RecallKnowledgeAPI {
    // Module information
    readonly moduleId: string;
    readonly version: string;

    // Settings
    settings: {
        get(key: string): unknown;
        set(key: string, value: unknown): Promise<unknown>;
        isRulesEngineEnabled(): boolean;
        isDebugMode(): boolean;
    };

    // Rules Engine
    rules: {
        addRuleElement(element: RuleElement): void;
        removeRuleElement(key: string): boolean;
        getRuleElement(key: string): RuleElement | undefined;
        getAllRuleElements(): RuleElement[];
        createKnowledgeRule(config: Partial<KnowledgeRuleElement>): KnowledgeRuleElement;
        createModifierRule(config: Partial<ModifierRuleElement>): ModifierRuleElement;
    };

    // Socket Communication
    socket: {
        shareKnowledgeCheck(actorId: string, checkType: string, result: any): void;
        shareKnowledge(knowledge: any, targetActorId: string, targets?: string[]): void;
        updateRules(ruleElement: any, action: 'add' | 'remove' | 'update'): void;
    };

    // Knowledge Functions
    knowledge: {
        performCheck(actor: any, checkType: string, options?: any): Promise<any>;
        getKnownInformation(actor: any): any[];
        addKnowledge(actor: any, knowledge: any): void;
        removeKnowledge(actor: any, knowledgeId: string): boolean;
    };

    // Utility Functions
    utils: {
        isKnowledgeSkill(skill: string): boolean;
        getDCForCreature(creature: any): number;
        formatKnowledgeResult(result: any): string;
    };
}

/**
 * Main Module API class
 */
export class ModuleAPI {
    private rulesEngine?: RulesEngine;
    private socketHandler?: SocketHandler;
    private settings?: RecallKnowledgeSettings;

    /**
     * Setup the API for external access
     */
    public setupAPI(): void {
        console.log(`${MODULE_ID} | Setting up module API`);

        // Create the API object
        const api: RecallKnowledgeAPI = {
            moduleId: MODULE_ID,
            version: this.getModuleVersion(),

            settings: {
                get: (key: string) => this.settings?.getSetting(key),
                set: (key: string, value: unknown) => this.settings?.setSetting(key, value) || Promise.resolve(undefined),
                isRulesEngineEnabled: () => this.settings?.isRulesEngineEnabled() || false,
                isDebugMode: () => this.settings?.isDebugMode() || false
            },

            rules: {
                addRuleElement: (element: RuleElement) => this.rulesEngine?.addRuleElement(element),
                removeRuleElement: (key: string) => this.rulesEngine?.removeRuleElement(key) || false,
                getRuleElement: (key: string) => this.rulesEngine?.getRuleElement(key),
                getAllRuleElements: () => this.rulesEngine?.getAllRuleElements() || [],
                createKnowledgeRule: (config: Partial<KnowledgeRuleElement>) => this.createKnowledgeRule(config),
                createModifierRule: (config: Partial<ModifierRuleElement>) => this.createModifierRule(config)
            },

            socket: {
                shareKnowledgeCheck: (actorId: string, checkType: string, result: any) =>
                    this.socketHandler?.shareKnowledgeCheck(actorId, checkType, result),
                shareKnowledge: (knowledge: any, targetActorId: string, targets?: string[]) =>
                    this.socketHandler?.shareKnowledge(knowledge, targetActorId, targets),
                updateRules: (ruleElement: any, action: 'add' | 'remove' | 'update') =>
                    this.socketHandler?.updateRules(ruleElement, action)
            },

            knowledge: {
                performCheck: (actor: any, checkType: string, options?: any) => this.performKnowledgeCheck(actor, checkType, options),
                getKnownInformation: (actor: any) => this.getKnownInformation(actor),
                addKnowledge: (actor: any, knowledge: any) => this.addKnowledge(actor, knowledge),
                removeKnowledge: (actor: any, knowledgeId: string) => this.removeKnowledge(actor, knowledgeId)
            },

            utils: {
                isKnowledgeSkill: (skill: string) => this.isKnowledgeSkill(skill),
                getDCForCreature: (creature: any) => this.getDCForCreature(creature),
                formatKnowledgeResult: (result: any) => this.formatKnowledgeResult(result)
            }
        };

        // Make API globally available
        (globalThis as any).RecallKnowledgeAPI = api;

        // Also make it available on the game object
        (game as any).RecallKnowledge = api;

        console.log(`${MODULE_ID} | API registered globally as RecallKnowledgeAPI and game.RecallKnowledge`);
    }

    /**
     * Set references to other module components
     */
    public setComponents(rulesEngine: RulesEngine, socketHandler: SocketHandler, settings: RecallKnowledgeSettings): void {
        this.rulesEngine = rulesEngine;
        this.socketHandler = socketHandler;
        this.settings = settings;
    }

    // =============================================================================
    // API Implementation Methods
    // =============================================================================

    /**
     * Get the module version
     */
    private getModuleVersion(): string {
        const module = game.modules.get(MODULE_ID);
        return module?.version || '1.0.0';
    }

    /**
     * Create a knowledge rule element with defaults
     */
    private createKnowledgeRule(config: Partial<KnowledgeRuleElement>): KnowledgeRuleElement {
        return {
            key: config.key || 'knowledge.custom',
            label: config.label || 'Custom Knowledge Check',
            selector: config.selector || 'check',
            dc: config.dc || 15,
            type: config.type || 'arcana',
            priority: config.priority || 10,
            success: config.success || 'You recall some information.',
            criticalSuccess: config.criticalSuccess || 'You recall detailed information.',
            failure: config.failure || 'You cannot recall anything useful.',
            criticalFailure: config.criticalFailure || 'You recall false information.',
            ...config
        };
    }

    /**
     * Create a modifier rule element with defaults
     */
    private createModifierRule(config: Partial<ModifierRuleElement>): ModifierRuleElement {
        return {
            key: config.key || 'modifier.custom',
            label: config.label || 'Custom Modifier',
            selector: config.selector || 'skill-check',
            type: config.type || 'circumstance',
            value: config.value || 0,
            priority: config.priority || 20,
            ...config
        };
    }

    /**
     * Perform a knowledge check
     */
    private async performKnowledgeCheck(actor: any, checkType: string, options: any = {}): Promise<any> {
        console.log(`${MODULE_ID} | Performing knowledge check: ${checkType} for ${actor.name}`);

        // Validate inputs
        if (!actor || !checkType) {
            throw new Error('Actor and checkType are required for knowledge checks');
        }

        // Check if this is a valid knowledge skill
        if (!this.isKnowledgeSkill(checkType)) {
            throw new Error(`${checkType} is not a valid knowledge skill`);
        }

        // Get the skill modifier
        const skillModifier = this.getSkillModifier(actor, checkType);

        // Determine DC (could come from options or be calculated)
        const dc = options.dc || this.getDCForCreature(options.target);

        // Create and evaluate the roll
        const roll = new Roll(`1d20 + ${skillModifier}`);
        await roll.evaluate();

        // Determine the result
        const total = roll.total || 0;
        const result = this.evaluateKnowledgeResult(total, dc);

        // Create result object
        const checkResult = {
            actor: actor.id,
            checkType,
            roll,
            total,
            dc,
            result,
            timestamp: Date.now()
        };

        // Share with other players if enabled
        if (this.settings?.getSetting('shareKnowledge')) {
            this.socketHandler?.shareKnowledgeCheck(actor.id, checkType, checkResult);
        }

        return checkResult;
    }

    /**
     * Get known information for an actor
     */
    private getKnownInformation(actor: any): any[] {
        const knowledgeFlag = actor.getFlag(MODULE_ID, 'knownInformation') || [];
        return knowledgeFlag;
    }

    /**
     * Add knowledge to an actor
     */
    private addKnowledge(actor: any, knowledge: any): void {
        const currentKnowledge = this.getKnownInformation(actor);
        const updatedKnowledge = [...currentKnowledge, { ...knowledge, id: foundry.utils.randomID() }];
        actor.setFlag(MODULE_ID, 'knownInformation', updatedKnowledge);
    }

    /**
     * Remove knowledge from an actor
     */
    private removeKnowledge(actor: any, knowledgeId: string): boolean {
        const currentKnowledge = this.getKnownInformation(actor);
        const filteredKnowledge = currentKnowledge.filter((k: any) => k.id !== knowledgeId);

        if (filteredKnowledge.length !== currentKnowledge.length) {
            actor.setFlag(MODULE_ID, 'knownInformation', filteredKnowledge);
            return true;
        }

        return false;
    }

    /**
     * Check if a skill is a knowledge skill
     */
    private isKnowledgeSkill(skill: string): boolean {
        const knowledgeSkills = ['arcana', 'nature', 'occultism', 'religion', 'crafting', 'lore'];
        return knowledgeSkills.includes(skill.toLowerCase());
    }

    /**
     * Get DC for a creature (simplified implementation)
     */
    private getDCForCreature(creature: any): number {
        if (!creature) return 15; // Default DC

        // Simple DC calculation based on creature level
        const level = creature.system?.level?.value || 0;
        return 10 + level; // Simplified formula
    }

    /**
     * Format knowledge check result
     */
    private formatKnowledgeResult(result: any): string {
        if (!result) return '';

        const { checkType, total, dc, result: outcome } = result;
        return `${checkType.charAt(0).toUpperCase() + checkType.slice(1)} Check: ${total} vs DC ${dc} (${outcome})`;
    }

    /**
     * Get skill modifier for an actor
     */
    private getSkillModifier(actor: any, skill: string): number {
        // This would need to be adapted based on the game system
        // For now, return a placeholder value
        return actor.system?.skills?.[skill]?.mod || 0;
    }

    /**
     * Evaluate knowledge check result
     */
    private evaluateKnowledgeResult(total: number, dc: number): string {
        const margin = total - dc;

        if (margin >= 10) return 'criticalSuccess';
        if (margin >= 0) return 'success';
        if (margin >= -10) return 'failure';
        return 'criticalFailure';
    }
}