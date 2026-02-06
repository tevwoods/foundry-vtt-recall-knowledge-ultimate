/**
 * Rules Engine for Recall Knowledge Module
 * Handles rule element creation, processing, and management
 */

import { MODULE_ID } from '../constants';

/**
 * Base interface for all rule elements
 */
export interface RuleElement {
    key: string;
    label: string;
    slug?: string;
    priority?: number;
    predicate?: string[];
    ignored?: boolean;
}

/**
 * Knowledge rule element for handling recall knowledge checks
 */
export interface KnowledgeRuleElement extends RuleElement {
    selector: string;
    dc: number | string;
    type: 'arcana' | 'nature' | 'occultism' | 'religion' | 'crafting' | 'lore';
    criticalSuccess?: string;
    success?: string;
    failure?: string;
    criticalFailure?: string;
}

/**
 * Modifier rule element for applying bonuses/penalties
 */
export interface ModifierRuleElement extends RuleElement {
    selector: string;
    type: 'bonus' | 'penalty' | 'circumstance' | 'status' | 'item';
    value: number | string;
    category?: string;
}

/**
 * Main Rules Engine class
 */
export class RulesEngine {
    private ruleElements: Map<string, RuleElement> = new Map();
    private processors: Map<string, (element: RuleElement) => void> = new Map();

    /**
     * Initialize the rules engine
     */
    public async initialize(): Promise<void> {
        console.log(`${MODULE_ID} | Initializing Rules Engine`);

        // Register built-in rule processors
        this.registerProcessor('knowledge', this.processKnowledgeRule.bind(this));
        this.registerProcessor('modifier', this.processModifierRule.bind(this));

        // Setup rule element hooks
        this.setupRuleHooks();
    }

    /**
     * Register a rule processor
     */
    public registerProcessor(type: string, processor: (element: RuleElement) => void): void {
        this.processors.set(type, processor);
        console.log(`${MODULE_ID} | Registered processor for rule type: ${type}`);
    }

    /**
     * Add a rule element
     */
    public addRuleElement(element: RuleElement): void {
        this.ruleElements.set(element.key, element);
        this.processRuleElement(element);
    }

    /**
     * Remove a rule element
     */
    public removeRuleElement(key: string): boolean {
        return this.ruleElements.delete(key);
    }

    /**
     * Get a rule element by key
     */
    public getRuleElement(key: string): RuleElement | undefined {
        return this.ruleElements.get(key);
    }

    /**
     * Get all rule elements
     */
    public getAllRuleElements(): RuleElement[] {
        return Array.from(this.ruleElements.values());
    }

    /**
     * Process a rule element based on its type
     */
    private processRuleElement(element: RuleElement): void {
        const processor = this.processors.get(element.key.split('.')[0]);
        if (processor) {
            processor(element);
        }
    }

    /**
     * Process knowledge rule elements
     */
    private processKnowledgeRule(element: RuleElement): void {
        const knowledgeRule = element as KnowledgeRuleElement;
        console.log(`${MODULE_ID} | Processing knowledge rule: ${knowledgeRule.label}`);

        // Add knowledge check functionality
        // This would integrate with the chat system and dice rolling
    }

    /**
     * Process modifier rule elements
     */
    private processModifierRule(element: RuleElement): void {
        const modifierRule = element as ModifierRuleElement;
        console.log(`${MODULE_ID} | Processing modifier rule: ${modifierRule.label}`);

        // Add modifier to the appropriate system
        // This would integrate with the actor data structure
    }

    /**
     * Setup hooks for rule processing
     */
    private setupRuleHooks(): void {
        // Hook into actor preparation to apply rule elements
        Hooks.on('preUpdateActor', (actor: any, updateData: any) => {
            this.processActorRules(actor, updateData);
        });

        // Hook into item preparation to apply rule elements
        Hooks.on('preUpdateItem', (item: any, updateData: any) => {
            this.processItemRules(item, updateData);
        });
    }

    /**
     * Process rules for actor updates
     */
    private processActorRules(actor: any, updateData: any): void {
        const actorRules = this.getRulesForActor(actor);
        actorRules.forEach(rule => this.processRuleElement(rule));
    }

    /**
     * Process rules for item updates
     */
    private processItemRules(item: any, updateData: any): void {
        const itemRules = this.getRulesForItem(item);
        itemRules.forEach(rule => this.processRuleElement(rule));
    }

    /**
     * Get rule elements that apply to a specific actor
     */
    private getRulesForActor(actor: any): RuleElement[] {
        return this.getAllRuleElements().filter(rule => {
            // Check predicates and selectors to see if rule applies to this actor
            return this.evaluatePredicate(rule.predicate, actor);
        });
    }

    /**
     * Get rule elements that apply to a specific item
     */
    private getRulesForItem(item: any): RuleElement[] {
        return this.getAllRuleElements().filter(rule => {
            // Check predicates and selectors to see if rule applies to this item
            return this.evaluatePredicate(rule.predicate, item);
        });
    }

    /**
     * Evaluate a predicate against a given context
     */
    private evaluatePredicate(predicate: string[] | undefined, context: any): boolean {
        if (!predicate || predicate.length === 0) {
            return true; // No predicate means rule always applies
        }

        // Simple predicate evaluation
        // In a full implementation, this would be more sophisticated
        return predicate.every(condition => {
            // Parse condition and evaluate against context
            return true; // Simplified for example
        });
    }

    /**
     * Create a sample knowledge rule element
     */
    public createSampleKnowledgeRule(): KnowledgeRuleElement {
        return {
            key: 'knowledge.sample',
            label: 'Sample Knowledge Check',
            selector: 'check',
            dc: 15,
            type: 'arcana',
            priority: 10,
            success: 'You recall basic information about this creature.',
            criticalSuccess: 'You recall detailed information about this creature\'s abilities and weaknesses.',
            failure: 'You cannot recall anything useful about this creature.',
            criticalFailure: 'You recall false information about this creature.'
        };
    }

    /**
     * Create a sample modifier rule element
     */
    public createSampleModifierRule(): ModifierRuleElement {
        return {
            key: 'modifier.sample',
            label: 'Sample Knowledge Bonus',
            selector: 'skill-check',
            type: 'circumstance',
            value: 2,
            priority: 20,
            predicate: ['action:recall-knowledge']
        };
    }
}