/**
 * Socket Handler for Recall Knowledge Module
 * Manages socket communications for multiplayer functionality
 */

import { MODULE_ID } from '../constants';

/**
 * Socket message interface
 */
export interface SocketMessage {
    type: string;
    data: any;
    sender: string;
    timestamp: number;
}

/**
 * Socket message types
 */
export enum SocketMessageType {
    KNOWLEDGE_CHECK = 'knowledgeCheck',
    SHARE_KNOWLEDGE = 'shareKnowledge',
    UPDATE_RULES = 'updateRules',
    SYNC_DATA = 'syncData',
    GM_APPROVAL_REQUEST = 'gmApprovalRequest',
    RECALL_KNOWLEDGE_RESULT = 'recallKnowledgeResult',
    RECALL_KNOWLEDGE_DENIED = 'recallKnowledgeDenied'
}/**
 * Main Socket Handler class
 */
export class SocketHandler {
    private socketName: string;
    private messageHandlers: Map<string, (message: SocketMessage) => void> = new Map();

    constructor() {
        this.socketName = `module.${MODULE_ID}`;
    }

    /**
     * Initialize socket handling
     */
    public initialize(): void {
        console.log(`${MODULE_ID} | Initializing socket handler`);

        // Register socket
        game.socket.on(this.socketName, (message: SocketMessage) => {
            this.handleSocketMessage(message);
        });

        // Register message handlers
        this.registerHandlers();
    }

    /**
     * Register message handlers
     */
    private registerHandlers(): void {
        this.messageHandlers.set(SocketMessageType.KNOWLEDGE_CHECK, this.handleKnowledgeCheck.bind(this));
        this.messageHandlers.set(SocketMessageType.SHARE_KNOWLEDGE, this.handleShareKnowledge.bind(this));
        this.messageHandlers.set(SocketMessageType.UPDATE_RULES, this.handleUpdateRules.bind(this));
        this.messageHandlers.set(SocketMessageType.SYNC_DATA, this.handleSyncData.bind(this));
        this.messageHandlers.set(SocketMessageType.GM_APPROVAL_REQUEST, this.handleGMApprovalRequest.bind(this));
        this.messageHandlers.set(SocketMessageType.RECALL_KNOWLEDGE_RESULT, this.handleRecallKnowledgeResult.bind(this));
        this.messageHandlers.set(SocketMessageType.RECALL_KNOWLEDGE_DENIED, this.handleRecallKnowledgeDenied.bind(this));
    }

    /**
     * Send a socket message
     */
    public sendMessage(type: string, data: any, targets?: string[]): void {
        const message: SocketMessage = {
            type,
            data,
            sender: game.user.id,
            timestamp: Date.now()
        };

        if (targets && targets.length > 0) {
            // Send to specific users
            targets.forEach(userId => {
                game.socket.emit(this.socketName, message, userId);
            });
        } else {
            // Broadcast to all users
            game.socket.emit(this.socketName, message);
        }

        console.log(`${MODULE_ID} | Sent socket message: ${type}`, data);
    }

    /**
     * Handle incoming socket messages
     */
    private handleSocketMessage(message: SocketMessage): void {
        console.log(`${MODULE_ID} | Received socket message: ${message.type}`, message);

        // Don't process our own messages
        if (message.sender === game.user.id) {
            return;
        }

        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        } else {
            console.warn(`${MODULE_ID} | No handler registered for message type: ${message.type}`);
        }
    }

    // =============================================================================
    // Message Handlers
    // =============================================================================

    /**
     * Handle knowledge check messages
     */
    private handleKnowledgeCheck(message: SocketMessage): void {
        const { actorId, checkType, result } = message.data;

        console.log(`${MODULE_ID} | Processing knowledge check from ${message.sender}`);

        // Process the knowledge check result
        this.processRemoteKnowledgeCheck(actorId, checkType, result);
    }

    /**
     * Handle share knowledge messages
     */
    private handleShareKnowledge(message: SocketMessage): void {
        const { knowledge, targetActorId } = message.data;

        console.log(`${MODULE_ID} | Received shared knowledge from ${message.sender}`);

        // Display the shared knowledge to the user
        this.displaySharedKnowledge(knowledge, targetActorId);
    }

    /**
     * Handle rule update messages
     */
    private handleUpdateRules(message: SocketMessage): void {
        const { ruleElement, action } = message.data;

        console.log(`${MODULE_ID} | Received rule update from ${message.sender}`);

        // Update local rules based on the message
        this.updateLocalRules(ruleElement, action);
    }

    /**
     * Handle sync data messages
     */
    private handleSyncData(message: SocketMessage): void {
        const { dataType, syncData } = message.data;

        console.log(`${MODULE_ID} | Received sync data from ${message.sender}`);

        // Synchronize local data with the received data
        this.synchronizeData(dataType, syncData);
    }

    // =============================================================================
    // Utility Methods
    // =============================================================================

    /**
     * Send a knowledge check result to other players
     */
    public shareKnowledgeCheck(actorId: string, checkType: string, result: any): void {
        this.sendMessage(SocketMessageType.KNOWLEDGE_CHECK, {
            actorId,
            checkType,
            result
        });
    }

    /**
     * Share knowledge information with specific players
     */
    public shareKnowledge(knowledge: any, targetActorId: string, targets?: string[]): void {
        this.sendMessage(SocketMessageType.SHARE_KNOWLEDGE, {
            knowledge,
            targetActorId
        }, targets);
    }

    /**
     * Broadcast rule element updates
     */
    public updateRules(ruleElement: any, action: 'add' | 'remove' | 'update'): void {
        // Only GM should broadcast rule updates
        if (!game.user.isGM) {
            return;
        }

        this.sendMessage(SocketMessageType.UPDATE_RULES, {
            ruleElement,
            action
        });
    }

    /**
     * Request data synchronization
     */
    public requestSync(dataType: string): void {
        this.sendMessage(SocketMessageType.SYNC_DATA, {
            dataType,
            request: true
        });
    }

    /**
     * Send synchronization data
     */
    public sendSyncData(dataType: string, syncData: any, targets?: string[]): void {
        this.sendMessage(SocketMessageType.SYNC_DATA, {
            dataType,
            syncData,
            request: false
        }, targets);
    }

    // =============================================================================
    // Processing Methods
    // =============================================================================

    /**
     * Process a remote knowledge check
     */
    private processRemoteKnowledgeCheck(actorId: string, checkType: string, result: any): void {
        // Handle the knowledge check result from another player
        // This might update UI, show notifications, or trigger other effects

        const actor = game.actors.get(actorId);
        if (!actor) {
            console.warn(`${MODULE_ID} | Actor not found for knowledge check: ${actorId}`);
            return;
        }

        // Show notification or update UI based on the result
        ui.notifications.info(`Knowledge check performed on ${actor.name} by another player`);
    }

    /**
     * Display shared knowledge to the user
     */
    private displaySharedKnowledge(knowledge: any, targetActorId: string): void {
        // Display the shared knowledge information
        // This might create a chat message or show a dialog

        const actor = game.actors.get(targetActorId);
        if (!actor) {
            return;
        }

        // Create a chat message with the shared knowledge
        // (Implementation would depend on the knowledge format)
    }

    /**
     * Update local rules based on remote changes
     */
    private updateLocalRules(ruleElement: any, action: 'add' | 'remove' | 'update'): void {
        // Update the local rules engine based on changes from other clients
        // This ensures all clients stay synchronized

        switch (action) {
            case 'add':
                // Add the rule element locally
                break;
            case 'remove':
                // Remove the rule element locally
                break;
            case 'update':
                // Update the existing rule element
                break;
        }
    }

    /**
     * Synchronize data with remote clients
     */
    private synchronizeData(dataType: string, syncData: any): void {
        // Handle different types of data synchronization

        switch (dataType) {
            case 'rules':
                // Synchronize rule elements
                break;
            case 'knowledge':
                // Synchronize knowledge data
                break;
            case 'settings':
                // Synchronize module settings
                break;
        }
    }

    /**
     * Check if user has permission for socket operations
     */
    private hasPermission(operation: string): boolean {
        // Check user permissions for specific operations
        // This might depend on GM status, module settings, etc.

        switch (operation) {
            case 'shareKnowledge':
                return true; // All users can share knowledge
            case 'updateRules':
                return game.user.isGM; // Only GMs can update rules
            default:
                return false;
        }
    }

    /**
     * Handle GM approval request messages
     */
    private handleGMApprovalRequest(message: SocketMessage): void {
        if (!game.user.isGM) return;

        const recallKnowledgeManager = (globalThis as any).RecallKnowledge?.module?.recallKnowledgeManager;
        if (recallKnowledgeManager) {
            recallKnowledgeManager.showGMApprovalDialog(message.data);
        }
    }

    /**
     * Handle recall knowledge result messages
     */
    private handleRecallKnowledgeResult(message: SocketMessage): void {
        const { result } = message.data;

        // Show result to player
        if (result.success) {
            ui.notifications.info(`Recall Knowledge ${result.degree}: You learned something!`);
        } else {
            ui.notifications.warn(`Recall Knowledge ${result.degree}: You couldn't recall anything useful.`);
        }
    }

    /**
     * Handle recall knowledge denied messages
     */
    private handleRecallKnowledgeDenied(message: SocketMessage): void {
        const { reason } = message.data;
        ui.notifications.warn(`Recall Knowledge request denied: ${reason || 'GM denied the request'}`);
    }
}