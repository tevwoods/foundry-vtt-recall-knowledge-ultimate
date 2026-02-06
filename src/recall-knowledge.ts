/**
 * Recall Knowledge - FoundryVTT Module
 * A comprehensive module for enhanced rules engine functionality and knowledge management
 */

import { MODULE_ID, MODULE_TITLE } from './constants';
import {
    HookManager,
    ModuleAPI,
    RecallKnowledgeManager,
    RecallKnowledgeSettings,
    RulesEngine,
    SocketHandler
} from './modules';

/**
 * Main module initialization class
 */
class RecallKnowledgeModule {
    private static instance: RecallKnowledgeModule;

    private settings!: RecallKnowledgeSettings;
    private rulesEngine!: RulesEngine;
    private hookManager!: HookManager;
    private socketHandler!: SocketHandler;
    private api!: ModuleAPI;
    private recallKnowledgeManager!: RecallKnowledgeManager;

    constructor() {
        if (RecallKnowledgeModule.instance) {
            return RecallKnowledgeModule.instance;
        }

        RecallKnowledgeModule.instance = this;

        this.settings = new RecallKnowledgeSettings();
        this.rulesEngine = new RulesEngine();
        this.hookManager = new HookManager();
        this.socketHandler = new SocketHandler();
        this.api = new ModuleAPI();
        this.recallKnowledgeManager = new RecallKnowledgeManager();
    }

    /**
     * Initialize the module
     */
    public async initialize(): Promise<void> {
        console.log(`${MODULE_TITLE} | Initializing module...`);

        try {
            // Register module settings
            await this.settings.register();

            // Initialize rules engine
            await this.rulesEngine.initialize();

            // Setup hooks
            this.hookManager.setupHooks();

            // Initialize socket handling
            this.socketHandler.initialize();

            // Setup API with component references
            this.api.setComponents(this.rulesEngine, this.socketHandler, this.settings);
            this.api.setupAPI();

            console.log(`${MODULE_TITLE} | Module initialized successfully`);
        } catch (error) {
            console.error(`${MODULE_TITLE} | Error during initialization:`, error);
        }
    }

    /**
     * Get the module instance
     */
    public static getInstance(): RecallKnowledgeModule {
        if (!RecallKnowledgeModule.instance) {
            RecallKnowledgeModule.instance = new RecallKnowledgeModule();
        }
        return RecallKnowledgeModule.instance;
    }

    /**
     * Get the recall knowledge manager
     */
    public getRecallKnowledgeManager(): RecallKnowledgeManager {
        return this.recallKnowledgeManager;
    }
}

// Initialize the module when Foundry is ready
Hooks.once('init', async () => {
    const module = RecallKnowledgeModule.getInstance();
    await module.initialize();
});

// Setup module for ready hook
Hooks.once('ready', () => {
    console.log(`${MODULE_TITLE} | Module ready`);

    const moduleInstance = RecallKnowledgeModule.getInstance();

    // Make the module globally available for debugging and API access
    (globalThis as any).game.RecallKnowledge = {
        module: moduleInstance,
        recallKnowledgeManager: moduleInstance.getRecallKnowledgeManager(),
        MODULE_ID,
        MODULE_TITLE,
    };
});