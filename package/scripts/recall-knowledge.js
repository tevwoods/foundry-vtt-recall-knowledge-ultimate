/**
 * Recall Knowledge - FoundryVTT Module
 * A comprehensive module for enhanced rules engine functionality and knowledge management
 */

const MODULE_ID = 'recall-knowledge';
const MODULE_TITLE = 'Recall Knowledge';

/**
 * Main module initialization
 */
class RecallKnowledgeModule {
    constructor() {
        this.settings = null;
        this.socketHandler = null;
        this.recallKnowledgeManager = null;
        this.initialized = false;
    }

    /**
     * Initialize the module
     */
    async initialize() {
        console.log(`${MODULE_TITLE} | Initializing module...`);

        try {
            // Initialize settings
            this.registerSettings();

            // Initialize socket handler
            this.socketHandler = new SocketHandler();

            // Initialize recall knowledge manager
            this.recallKnowledgeManager = new RecallKnowledgeManager();

            // Register hooks
            this.registerHooks();

            // Expose API
            this.exposeAPI();

            this.initialized = true;
            console.log(`${MODULE_TITLE} | Module initialized successfully`);
        } catch (error) {
            console.error(`${MODULE_TITLE} | Initialization failed:`, error);
        }
    }

    /**
     * Register module settings
     */
    registerSettings() {
        // Enable/disable GM approval requirement
        game.settings.register(MODULE_ID, 'requireGMApproval', {
            name: 'Require GM Approval',
            hint: 'When enabled, GMs must approve all recall knowledge attempts.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        // Auto-calculate DC setting
        game.settings.register(MODULE_ID, 'autoCalculateDC', {
            name: 'Auto-Calculate DC',
            hint: 'Automatically calculate DC based on creature level.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        // Revealable information configuration
        game.settings.register(MODULE_ID, 'revealableInfo', {
            name: 'Revealable Information',
            hint: 'Configure what information can be revealed.',
            scope: 'world',
            config: false,
            type: Object,
            default: {
                criticalSuccess: ['name', 'type', 'level', 'ac', 'hp', 'saves', 'resistances', 'weaknesses', 'immunities', 'traits', 'abilities'],
                success: ['name', 'type', 'level', 'ac', 'traits'],
                failure: ['name', 'type'],
                criticalFailure: []
            }
        });

        // Hide roll results from player
        game.settings.register(MODULE_ID, 'hideRollFromPlayer', {
            name: 'Hide Roll Results from Player',
            hint: 'When enabled, players will not see their roll results. Only the GM will see the actual roll.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        // Enable false information on critical failure
        game.settings.register(MODULE_ID, 'falseInfoOnCritFail', {
            name: 'False Information on Critical Failure',
            hint: 'When enabled, players who critically fail will receive false information instead of being told they failed.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        // Share knowledge with party
        game.settings.register(MODULE_ID, 'shareWithParty', {
            name: 'Share Knowledge with Party',
            hint: 'When enabled, all recalled information is automatically shared with party members. Party members can see all information learned by any party member.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        // Bestiary Scholar skill choice (per-user)
        game.settings.register(MODULE_ID, 'bestiaryScholarSkill', {
            name: 'Bestiary Scholar Skill',
            hint: 'If you have the Bestiary Scholar feat, select which of the four core knowledge skills you use to identify all creatures.',
            scope: 'client',
            config: true,
            type: String,
            default: '',
            choices: {
                '': 'None (No Bestiary Scholar)',
                'arcana': 'Arcana',
                'nature': 'Nature',
                'occultism': 'Occultism',
                'religion': 'Religion'
            }
        });

        // Thorough Reports configuration menu
        game.settings.registerMenu(MODULE_ID, 'thoroughReportsConfig', {
            name: 'Configure Thorough Reports',
            label: 'Manage Creature Types',
            hint: 'Configure which creature types you have already identified for the Thorough Reports feat.',
            icon: 'fas fa-book',
            type: ThoroughReportsConfig,
            restricted: false
        });
    }

    /**
     * Register hooks
     */
    registerHooks() {
        // Ready hook
        Hooks.once('ready', () => {
            console.log(`${MODULE_TITLE} | Ready`);
        });

        // Socket message handler
        Hooks.on('socketlib.receiveMessage', (userId, data) => {
            if (this.socketHandler) {
                this.socketHandler.handleMessage(data);
            }
        });
    }

    /**
     * Expose module API
     */
    exposeAPI() {
        const api = {
            module: this,
            initiateRecallKnowledge: () => {
                if (this.recallKnowledgeManager) {
                    return this.recallKnowledgeManager.initiateRecallKnowledge();
                }
            },
            showLearnedInformation: () => {
                if (this.recallKnowledgeManager) {
                    return this.recallKnowledgeManager.showLearnedInformation();
                }
            },
            getSettings: () => this.settings,
            isInitialized: () => this.initialized
        };

        // Expose on both globalThis and game for compatibility
        globalThis.RecallKnowledge = api;
        game.RecallKnowledge = api;
    }
}

/**
 * Simple Socket Handler
 */
class SocketHandler {
    constructor() {
        this.messageHandlers = new Map();
        this.setupHandlers();
    }

    setupHandlers() {
        this.messageHandlers.set('GM_APPROVAL_REQUEST', this.handleGMApprovalRequest.bind(this));
        this.messageHandlers.set('GM_APPROVAL_RESPONSE', this.handleGMApprovalResponse.bind(this));
        this.messageHandlers.set('RECALL_KNOWLEDGE_RESULT', this.handleRecallKnowledgeResult.bind(this));
        this.messageHandlers.set('RECALL_KNOWLEDGE_DENIED', this.handleRecallKnowledgeDenied.bind(this));
    }

    handleMessage(data) {
        const handler = this.messageHandlers.get(data.type);
        if (handler) {
            handler(data);
        }
    }

    handleGMApprovalRequest(data) {
        if (!game.user.isGM) return;

        console.log('GM Approval Request received:', data);

        // Get current attempt count
        const currentAttempts = this.module?.recallKnowledgeManager?.getRecallAttempts(data.actorId, data.targetId) || 0;

        // Get actor and target names for display
        const actor = game.actors.get(data.actorId);
        const target = game.actors.get(data.targetId) || canvas.tokens.get(data.targetId)?.actor;
        const actorName = actor?.name || 'Unknown Actor';
        const targetName = target?.name || 'Unknown Target';

        // Calculate current DC
        const baseDC = target?.system?.details?.level?.value ? 10 + target.system.details.level.value : 15;
        const currentDC = baseDC + (currentAttempts * 2);

        let content = `
            <div style="margin-bottom: 12px;">
                <p><strong>Player:</strong> ${data.playerName}</p>
                <p><strong>Character:</strong> ${actorName}</p>
                <p><strong>Target:</strong> ${targetName}</p>
                <p><strong>Available Skills:</strong> ${data.availableSkills.join(', ')}</p>
            </div>
            <div style="margin-bottom: 12px; padding: 8px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
                <p><strong>Recall Knowledge Attempts:</strong></p>
                <p style="margin: 4px 0;">Current attempts: <span id="current-attempts">${currentAttempts}</span></p>
                <p style="margin: 4px 0;">Current DC: <span id="current-dc">${currentDC}</span> (Base: ${baseDC} + ${currentAttempts} attempts × 2)</p>
                <hr style="margin: 8px 0;">
                <label for="attempt-input">Adjust attempt count:</label>
                <input type="number" id="attempt-input" value="${currentAttempts}" min="0" max="20" style="width: 60px; margin-left: 8px;">
                <button type="button" id="update-attempts" style="margin-left: 8px; padding: 2px 8px;">Update DC</button>
                <p style="margin: 4px 0; font-size: 0.9em; color: #666;">New DC: <span id="new-dc">${currentDC}</span></p>
            </div>
        `;

        const dialog = new Dialog({
            title: 'GM: Approve Recall Knowledge',
            content: content,
            buttons: {
                approve: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Approve',
                    callback: async (html) => {
                        const finalAttempts = parseInt(html.find('#attempt-input').val()) || 0;

                        // Update the attempt count before proceeding
                        await this.module?.recallKnowledgeManager?.setRecallAttempts(data.actorId, data.targetId, finalAttempts);

                        const approvalData = {
                            approved: true,
                            playerId: data.playerId,
                            actorId: data.actorId,
                            targetId: data.targetId,
                            adjustedAttempts: finalAttempts
                        };

                        // Send approval back to player
                        if (this.module?.socketHandler) {
                            this.module.socketHandler.emit('GM_APPROVAL_RESPONSE', approvalData);
                        }

                        ui.notifications.info(`Recall Knowledge approved for ${actorName} vs ${targetName} (${finalAttempts} attempts)`);
                    }
                },
                deny: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Deny',
                    callback: () => {
                        const denialData = {
                            approved: false,
                            playerId: data.playerId,
                            reason: 'GM denied the request'
                        };

                        // Send denial back to player
                        if (this.module?.socketHandler) {
                            this.module.socketHandler.emit('GM_APPROVAL_RESPONSE', denialData);
                        }

                        ui.notifications.info(`Recall Knowledge denied for ${actorName}`);
                    }
                }
            },
            default: 'approve',
            close: () => {
                // Handle dialog close without decision (treat as denial)
                const denialData = {
                    approved: false,
                    playerId: data.playerId,
                    reason: 'GM closed dialog without decision'
                };

                if (this.module?.socketHandler) {
                    this.module.socketHandler.emit('GM_APPROVAL_RESPONSE', denialData);
                }
            }
        }, {
            width: 450,
            jQuery: true
        });

        dialog.render(true);

        // Add event listener for attempt count updates
        setTimeout(() => {
            const attemptInput = dialog.element.find('#attempt-input');
            const updateBtn = dialog.element.find('#update-attempts');
            const newDcSpan = dialog.element.find('#new-dc');

            const updateDC = () => {
                const newAttempts = parseInt(attemptInput.val()) || 0;
                const newDC = baseDC + (newAttempts * 2);
                newDcSpan.text(newDC);
            };

            attemptInput.on('input', updateDC);
            updateBtn.on('click', updateDC);
        }, 100);

        // Store reference to this module for callbacks
        if (!this.module) {
            this.module = globalThis.RecallKnowledge?.module;
        }
    }

    handleGMApprovalResponse(data) {
        // Only handle responses meant for this user
        if (data.playerId !== game.user.id) return;

        console.log('GM Approval Response received:', data);

        if (data.approved) {
            ui.notifications.info('GM approved your Recall Knowledge request!');
            // Continue with the recall knowledge process
            const actor = game.actors.get(data.actorId);
            const target = game.actors.get(data.targetId) || canvas.tokens.get(data.targetId);

            if (actor && target && this.module?.recallKnowledgeManager) {
                // The attempt count has already been set by the GM, so continue with skill selection
                const targetActor = target.actor || target;
                const appropriateSkills = this.module.recallKnowledgeManager.getAppropriateSkills(targetActor);
                this.module.recallKnowledgeManager.showSkillSelectionDialog(actor, target, appropriateSkills);
            }
        } else {
            ui.notifications.warn(`GM denied your Recall Knowledge request: ${data.reason || 'No reason provided'}`);
        }
    }

    handleRecallKnowledgeResult(data) {
        console.log('Recall Knowledge Result received:', data);
        // Handle recall knowledge result
    }

    handleRecallKnowledgeDenied(data) {
        console.log('Recall Knowledge Denied:', data);
        // Handle recall knowledge denial
    }

    emit(type, data) {
        if (game.socket) {
            game.socket.emit('module.recall-knowledge', { type, ...data });
        }
    }
}

/**
 * Recall Knowledge Manager
 */
class RecallKnowledgeManager {
    constructor() {
        this.pendingRequests = new Map();
    }

    async initiateRecallKnowledge(providedActor = null, providedTarget = null) {
        // Check if user has a target
        const targets = providedTarget ? [providedTarget] : Array.from(game.user.targets);
        if (targets.length === 0) {
            ui.notifications.warn('Please target a creature first.');
            return;
        }

        const target = targets[0];

        // Get actor from provided parameter, controlled token, or assigned character
        let actor = providedActor;
        if (!actor) {
            const controlled = canvas.tokens.controlled;
            if (controlled.length > 0) {
                actor = controlled[0].actor;
            } else {
                actor = game.user.character;
            }
        }

        if (!actor) {
            ui.notifications.error('No character selected.');
            return;
        }

        // Get available knowledge skills
        const availableSkills = this.getKnowledgeSkills(actor);

        if (availableSkills.length === 0) {
            ui.notifications.warn('No knowledge skills available.');
            return;
        }

        // Check if GM approval is required
        const requireGMApproval = game.settings.get(MODULE_ID, 'requireGMApproval');

        if (requireGMApproval && game.user.isGM === false) {
            // Send approval request to GM
            this.sendGMApprovalRequest(actor, target, availableSkills);
        } else {
            // Direct skill selection
            this.showSkillSelectionDialog(actor, target, availableSkills);
        }
    }

    /**
     * Show all learned information about a targeted creature
     */
    showLearnedInformation() {
        // Check if user has a target
        const targets = Array.from(game.user.targets);
        if (targets.length === 0) {
            ui.notifications.warn('Please target a creature first.');
            return;
        }

        const target = targets[0];
        const targetActor = target.actor || target;
        const targetId = targetActor.id || targetActor.uuid;
        const targetName = target.name || target.actor?.name || 'Unknown';

        // Get actor
        let actor = null;
        const controlled = canvas.tokens.controlled;
        if (controlled.length > 0) {
            actor = controlled[0].actor;
        } else {
            actor = game.user.character;
        }

        if (!actor) {
            ui.notifications.error('No character selected.');
            return;
        }

        const actorId = actor.id;
        const shareWithParty = game.settings.get(MODULE_ID, 'shareWithParty');

        console.log(`${MODULE_TITLE} | Viewing learned info for actor ${actorId}, target ${targetId}`);
        console.log(`${MODULE_TITLE} | Party sharing: ${shareWithParty}`);

        // Get learned information
        let learnedInfo = [];
        let infoByLearner = new Map(); // Track who learned what

        if (shareWithParty) {
            // Find "The Party" actor (PF2e party system)
            const partyActor = game.actors.find(a => a.type === "party" || a.name === "The Party");
            console.log(`${MODULE_TITLE} | Party actor:`, partyActor?.name);

            // Get party members from the party actor
            const partyActors = partyActor?.system?.details?.members ? Array.from(partyActor.system.details.members).map(m => game.actors.get(m.uuid.split('.').pop())) : [];
            console.log(`${MODULE_TITLE} | Found ${partyActors.length} party members:`, partyActors.map(a => a?.name));

            for (const partyActor of partyActors) {
                console.log(`${MODULE_TITLE} | Checking party member: ${partyActor.name} (${partyActor.id})`);

                // Check all users for this actor's learned information
                for (const user of game.users) {
                    const userLearnedInfo = user.getFlag(MODULE_ID, `learnedInfo.${partyActor.id}.${targetId}`) || [];
                    if (userLearnedInfo.length > 0) {
                        console.log(`${MODULE_TITLE} | User ${user.name} has info for ${partyActor.name}:`, userLearnedInfo);

                        userLearnedInfo.forEach(info => {
                            if (!learnedInfo.includes(info)) {
                                learnedInfo.push(info);
                            }
                            if (!infoByLearner.has(info)) {
                                infoByLearner.set(info, []);
                            }
                            if (!infoByLearner.get(info).includes(partyActor.name)) {
                                infoByLearner.get(info).push(partyActor.name);
                            }
                        });
                    }
                }
            }
            console.log(`${MODULE_TITLE} | Final learned info:`, learnedInfo);
        } else {
            learnedInfo = game.user.getFlag(MODULE_ID, `learnedInfo.${actorId}.${targetId}`) || [];
            console.log(`${MODULE_TITLE} | Personal learned info:`, learnedInfo);
        }

        if (learnedInfo.length === 0) {
            ui.notifications.info(`${shareWithParty ? 'Your party hasn\'t' : 'You haven\'t'} learned anything about ${targetName} yet.`);
            return;
        }

        // Build content
        let content = `<div style="padding: 8px;">`;
        content += `<h2 style="margin-top: 0;">Known Information: ${targetName}</h2>`;
        if (shareWithParty) {
            content += `<p style="font-style: italic; color: #666; margin-top: 0;">Party knowledge shared</p>`;
        }
        content += `<ul style="list-style: none; padding-left: 0;">`;

        for (const infoId of learnedInfo) {
            const infoValue = this.getInformationValue(targetActor, infoId);
            const infoLabel = this.getInfoLabel(infoId);

            if (shareWithParty && infoByLearner.has(infoId)) {
                const learners = infoByLearner.get(infoId);
                content += `<li style="margin-bottom: 8px;">
                    <strong>${infoLabel}:</strong> ${infoValue}
                    <span style="font-size: 0.85em; color: #666; font-style: italic;"> (learned by ${learners.join(', ')})</span>
                </li>`;
            } else {
                content += `<li style="margin-bottom: 8px;"><strong>${infoLabel}:</strong> ${infoValue}</li>`;
            }
        }

        content += `</ul></div>`;

        new Dialog({
            title: `Recall Knowledge: ${targetName}`,
            content: content,
            buttons: {
                close: {
                    label: 'Close'
                }
            }
        }).render(true);
    }

    /**
     * Get readable label for info ID
     */
    getInfoLabel(infoId) {
        const labels = {
            'highest-save': 'Highest Save',
            'lowest-save': 'Lowest Save',
            'resistances': 'Resistances',
            'weaknesses': 'Weaknesses',
            'immunities': 'Immunities',
            'attacks': 'Attacks',
            'skills': 'Skills',
            'background': 'Background',
            'special-attacks': 'Special Attacks',
            'special-abilities': 'Special Abilities'
        };
        return labels[infoId] || infoId;
    }

    getKnowledgeSkills(actor) {
        const skills = [];

        // Add all core knowledge skills (expanded list for PF2e Remaster)
        const coreSkills = ['arcana', 'crafting', 'occultism', 'nature', 'religion', 'society'];
        for (const skillKey of coreSkills) {
            const skill = actor.system.skills?.[skillKey];
            if (skill) {
                // Handle different skill data structures
                const modifier = skill.mod ?? skill.totalModifier ?? skill.value ?? 0;
                const label = skill.label ?? skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

                skills.push({
                    key: skillKey,
                    name: label,
                    modifier: modifier
                });
            }
        }

        // Add lore skills
        if (actor.system.skills) {
            const loreSkills = Object.entries(actor.system.skills).filter(([key]) => key.toLowerCase().includes('lore'));
            for (const [key, skill] of loreSkills) {
                const modifier = skill.mod ?? skill.totalModifier ?? skill.value ?? 0;
                const label = skill.label || 'Lore';

                skills.push({
                    key: key,
                    name: label,
                    modifier: modifier
                });
            }
        }

        // Sort skills by modifier in descending order
        skills.sort((a, b) => b.modifier - a.modifier);

        return skills;
    }

    /**
     * Get appropriate Recall Knowledge skills for a creature based on its traits
     * Reference: PF2e Core Rulebook, Recall Knowledge action
     */
    getAppropriateSkills(targetActor) {
        if (!targetActor?.system?.traits?.value) return [];

        const traits = targetActor.system.traits.value.map(t => t.toLowerCase());
        const appropriateSkills = [];

        // Universal Lore skills that work for ALL Recall Knowledge checks
        const universalLores = ['bardic-lore', 'esoteric-lore', 'gossip-lore', 'loremaster-lore'];
        appropriateSkills.push(...universalLores);

        // Map creature traits to appropriate skills
        // Reference: https://2e.aonprd.com/Actions.aspx?ID=26

        if (traits.includes('aberration')) {
            appropriateSkills.push('occultism');
        }

        if (traits.includes('animal')) {
            appropriateSkills.push('nature');
        }

        if (traits.includes('astral')) {
            appropriateSkills.push('occultism');
        }

        if (traits.includes('beast')) {
            appropriateSkills.push('arcana', 'nature');
        }

        if (traits.includes('celestial')) {
            appropriateSkills.push('religion');
        }

        if (traits.includes('construct')) {
            appropriateSkills.push('arcana', 'crafting');
        }

        if (traits.includes('dragon')) {
            appropriateSkills.push('arcana');
        }

        if (traits.includes('elemental')) {
            appropriateSkills.push('arcana', 'nature');
        }

        if (traits.includes('ethereal')) {
            appropriateSkills.push('occultism');
        }

        if (traits.includes('fey')) {
            appropriateSkills.push('nature');
        }

        if (traits.includes('fiend')) {
            appropriateSkills.push('religion');
        }

        if (traits.includes('fungus')) {
            appropriateSkills.push('nature');
        }

        if (traits.includes('giant')) {
            appropriateSkills.push('society'); // Added in Remaster
        }

        if (traits.includes('humanoid')) {
            appropriateSkills.push('society');
        }

        if (traits.includes('monitor')) {
            appropriateSkills.push('religion');
        }

        if (traits.includes('ooze')) {
            appropriateSkills.push('occultism');
        }

        if (traits.includes('plant')) {
            appropriateSkills.push('nature');
        }

        if (traits.includes('undead')) {
            appropriateSkills.push('religion');
        }

        // Add Bestiary Scholar skill if configured and character has the feat
        // Bestiary Scholar works when nature, religion, occultism, or arcana would be appropriate
        const bestiaryScholarSkill = game.settings.get(MODULE_ID, 'bestiaryScholarSkill');
        if (bestiaryScholarSkill && bestiaryScholarSkill !== '') {
            // Check if any of the core knowledge skills are appropriate
            const knowledgeSkills = ['nature', 'religion', 'occultism', 'arcana'];
            const hasKnowledgeSkill = knowledgeSkills.some(skill => appropriateSkills.includes(skill));

            if (hasKnowledgeSkill) {
                appropriateSkills.push(bestiaryScholarSkill);
            }
        }

        // Remove duplicates
        return [...new Set(appropriateSkills)];
    }

    sendGMApprovalRequest(actor, target, availableSkills) {
        const request = {
            playerId: game.user.id,
            playerName: game.user.name,
            actorId: actor.id,
            targetId: target.id,
            availableSkills: availableSkills,
            timestamp: Date.now()
        };

        // Emit to GMs
        const socketHandler = globalThis.RecallKnowledge?.module?.socketHandler;
        if (socketHandler) {
            socketHandler.emit('GM_APPROVAL_REQUEST', request);
        }

        ui.notifications.info('Recall Knowledge request sent to GM for approval. The GM can adjust your attempt count if needed.');
    }

    showSkillSelectionDialog(actor, target, availableSkills) {
        // Get appropriate skills for this creature type
        const targetActor = target.actor || target;
        let appropriateSkills = this.getAppropriateSkills(targetActor);

        // Add Bestiary Scholar skill if character has the feat and knowledge skills are appropriate
        const bestiaryScholarSkill = game.settings.get(MODULE_ID, 'bestiaryScholarSkill');
        if (bestiaryScholarSkill && bestiaryScholarSkill !== '' && this.hasBestiaryScholar(actor)) {
            const knowledgeSkills = ['nature', 'religion', 'occultism', 'arcana'];
            const hasKnowledgeSkill = knowledgeSkills.some(skill => appropriateSkills.includes(skill));

            if (hasKnowledgeSkill && !appropriateSkills.includes(bestiaryScholarSkill)) {
                appropriateSkills.push(bestiaryScholarSkill);
            }
        }

        const skillOptions = availableSkills.map((skill, index) => {
            const modifierText = skill.modifier >= 0 ? `+${skill.modifier}` : skill.modifier;

            // Determine color coding
            let backgroundColor = 'transparent';
            let borderColor = '#999';

            if (appropriateSkills.includes(skill.key)) {
                // Appropriate skill (including universal lores) - Green
                backgroundColor = '#d4edda';
                borderColor = '#28a745';
            } else if (skill.key.toLowerCase().includes('lore')) {
                // Other Lore skill - Purple
                backgroundColor = '#e8d4f0';
                borderColor = '#6f42c1';
            }

            return `
                <div style="margin: 8px 0;">
                    <label style="display: flex; align-items: center; cursor: pointer; padding: 8px; border: 2px solid ${borderColor}; border-radius: 4px; background: ${backgroundColor};">
                        <input type="radio" name="selectedSkill" value="${skill.key}" ${index === 0 ? 'checked' : ''} style="margin-right: 8px;">
                        <span><strong>${skill.name}</strong> (${modifierText})</span>
                    </label>
                </div>
            `;
        }).join('');

        // Check if any selected skill has Assurance
        const hasAnyAssurance = availableSkills.some(skill => {
            const actorSkill = actor.system.skills?.[skill.key];
            return actorSkill?.modifiers?.some(m => m.slug === 'assurance' || m.type === 'ability');
        });

        const content = `
            <div class="recall-knowledge-dialog">
                <p>Select a knowledge skill to use against <strong>${target.name}</strong>:</p>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 12px;">
                    <span style="color: #28a745;">■</span> Appropriate for creature type &nbsp;
                    <span style="color: #6f42c1;">■</span> Lore (may be appropriate)
                </p>
                <div style="margin: 12px 0;">
                    ${skillOptions}
                </div>
                ${hasAnyAssurance ? `
                <div style="margin-top: 16px; padding: 8px; border: 1px solid #ffc107; border-radius: 4px; background: #fff3cd;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="useAssurance" style="margin-right: 8px;">
                        <span><strong>Use Assurance</strong> (10 + proficiency only, if available for selected skill)</span>
                    </label>
                </div>
                ` : ''}
            </div>
        `;

        new Dialog({
            title: 'Recall Knowledge',
            content: content,
            buttons: {
                roll: {
                    label: 'Roll',
                    callback: (html) => {
                        const selectedSkill = html.find('[name="selectedSkill"]:checked').val();
                        const useAssurance = html.find('#useAssurance').is(':checked');
                        this.performRecallKnowledgeRoll(actor, target, selectedSkill, useAssurance);
                    }
                },
                cancel: {
                    label: 'Cancel'
                }
            },
            default: 'roll'
        }).render(true);
    }

    async performRecallKnowledgeRoll(actor, target, skillKey, useAssurance = false) {
        const skill = actor.system.skills?.[skillKey];
        if (!skill) {
            ui.notifications.error('Selected skill not found.');
            return;
        }

        // Get modifier with fallbacks
        let modifier = skill.mod ?? skill.totalModifier ?? skill.value ?? 0;
        const skillLabel = skill.label ?? skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

        // Get target IDs for tracking - use actor ID not token ID
        const targetActor = target.actor || target;
        const targetId = targetActor.id || targetActor.uuid;
        const actorId = actor.id;

        // Check for Assurance feat on this skill
        let hasAssurance = false;
        let assuranceValue = 10;

        if (useAssurance) {
            // Check if actor has Assurance feat for this skill
            const assuranceFeat = actor.items.find(item =>
                item.type === 'feat' &&
                (item.slug === `assurance-${skillKey}` ||
                    item.name?.toLowerCase() === `assurance (${skillLabel.toLowerCase()})` ||
                    item.system?.rules?.some(rule =>
                        rule.key === 'RollOption' &&
                        rule.option === `assurance:${skillKey}`
                    ))
            );

            if (assuranceFeat) {
                hasAssurance = true;
                // Assurance uses 10 + proficiency bonus (rank * 2 + level)
                const rank = skill.rank ?? 0;
                const level = actor.system.details?.level?.value ?? 0;
                assuranceValue = 10 + (rank * 2) + level;
            } else {
                ui.notifications.warn(`You don't have Assurance for ${skillLabel}.`);
                useAssurance = false;
            }
        }

        // Check for Thorough Reports bonus (does NOT apply with Assurance)
        const thoroughReportsBonus = this.checkThoroughReportsBonus(actor, targetActor, skillKey);

        // Calculate DC with adjustments for previous attempts
        const autoCalculateDC = game.settings.get(MODULE_ID, 'autoCalculateDC');
        let dc = 15; // Default DC

        if (autoCalculateDC && target.actor) {
            const level = target.actor.system.details?.level?.value || 0;
            dc = 10 + level; // Simple DC calculation
        }

        // Increase DC by 2 for each previous Recall Knowledge attempt (PF2e standard)
        const previousAttempts = this.getRecallAttempts(actorId, targetId);
        dc += (previousAttempts * 2);

        // Note: Attempts will be incremented AFTER the roll completes

        // Perform the roll or use Assurance
        let roll;
        let rollTotal;
        let degree = 'failure';

        if (useAssurance && hasAssurance) {
            // Create a fake roll for Assurance (no randomness, no bonuses)
            rollTotal = assuranceValue;
            roll = await new Roll(`${rollTotal}`).evaluate();
            roll._formula = `Assurance: 10 + proficiency`;

            // Determine success level
            if (rollTotal >= dc + 10) {
                degree = 'criticalSuccess';
            } else if (rollTotal >= dc) {
                degree = 'success';
            } else if (rollTotal <= dc - 10) {
                degree = 'criticalFailure';
            }

            // Process the result after Assurance
            this.processRecallKnowledgeResult(actor, target, skillKey, roll, rollTotal, degree, dc, useAssurance, hasAssurance, assuranceValue, thoroughReportsBonus, actorId, targetId, targetActor);
        } else {
            // Use PF2e's native skill check dialog via the Statistic object
            console.log(`${MODULE_TITLE} | Attempting to use PF2e roll dialog for skill: ${skillKey}`);

            // Get the skill statistic from actor.skills
            const skillStatistic = actor.skills?.[skillKey];

            if (skillStatistic && typeof skillStatistic.roll === 'function') {
                console.log(`${MODULE_TITLE} | Using skill statistic.roll() method`);

                // Build roll options
                const rollConfig = {
                    dc: { value: dc },
                    skipDialog: false,
                    createMessage: false, // We'll create our own message
                    rollMode: game.settings.get('core', 'rollMode')
                };

                // Add Thorough Reports as a modifier if applicable
                if (thoroughReportsBonus > 0) {
                    rollConfig.modifiers = [{
                        label: 'Thorough Reports',
                        modifier: thoroughReportsBonus,
                        type: 'circumstance'
                    }];
                }

                try {
                    const checkRoll = await skillStatistic.roll(rollConfig);

                    if (!checkRoll) {
                        console.log(`${MODULE_TITLE} | Roll was cancelled`);
                        return;
                    }

                    roll = checkRoll;
                    rollTotal = roll.total;

                    console.log(`${MODULE_TITLE} | Roll result:`, roll);
                    console.log(`${MODULE_TITLE} | Roll total:`, rollTotal);
                    console.log(`${MODULE_TITLE} | Degree of success:`, roll.degreeOfSuccess);

                    // Determine degree from PF2e roll
                    const degreeValue = roll.degreeOfSuccess;
                    if (degreeValue !== undefined) {
                        degree = degreeValue === 3 ? 'criticalSuccess' :
                            degreeValue === 2 ? 'success' :
                                degreeValue === 1 ? 'failure' : 'criticalFailure';
                    } else {
                        // Fallback to manual calculation
                        if (rollTotal >= dc + 10) {
                            degree = 'criticalSuccess';
                        } else if (rollTotal >= dc) {
                            degree = 'success';
                        } else if (rollTotal <= dc - 10) {
                            degree = 'criticalFailure';
                        }
                    }

                    console.log(`${MODULE_TITLE} | Degree of success:`, degree);

                    // Process the result
                    this.processRecallKnowledgeResult(actor, target, skillKey, roll, rollTotal, degree, dc, useAssurance, hasAssurance, assuranceValue, thoroughReportsBonus, actorId, targetId, targetActor);
                } catch (error) {
                    console.error(`${MODULE_TITLE} | Error rolling skill:`, error);
                    // Fallback to basic roll
                    const modifier = skill.mod ?? skill.totalModifier ?? skill.value ?? 0;
                    await this.performBasicRoll(actor, target, skillKey, modifier, dc, thoroughReportsBonus, actorId, targetId, targetActor);
                }
            } else {
                console.log(`${MODULE_TITLE} | Falling back to basic roll - skill statistic not found`);
                // Fallback to basic roll if PF2e skill statistic not available
                const modifier = skill.mod ?? skill.totalModifier ?? skill.value ?? 0;
                await this.performBasicRoll(actor, target, skillKey, modifier, dc, thoroughReportsBonus, actorId, targetId, targetActor);
            }
        }
    }

    async performBasicRoll(actor, target, skillKey, modifier, dc, thoroughReportsBonus, actorId, targetId, targetActor) {
        const skill = actor.system.skills?.[skillKey];
        const skillLabel = skill.label ?? skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

        // Apply Thorough Reports bonus
        if (thoroughReportsBonus > 0) {
            modifier += thoroughReportsBonus;
        }

        const roll = await new Roll(`1d20 + ${modifier}`).evaluate();
        const rollTotal = roll.total;

        // Determine success level
        let degree = 'failure';
        if (rollTotal >= dc + 10) {
            degree = 'criticalSuccess';
        } else if (rollTotal >= dc) {
            degree = 'success';
        } else if (rollTotal <= dc - 10) {
            degree = 'criticalFailure';
        }

        this.processRecallKnowledgeResult(actor, target, skillKey, roll, rollTotal, degree, dc, false, false, 0, thoroughReportsBonus, actorId, targetId, targetActor);
    }

    async processRecallKnowledgeResult(actor, target, skillKey, roll, rollTotal, degree, dc, useAssurance, hasAssurance, assuranceValue, thoroughReportsBonus, actorId, targetId, targetActor) {
        const skill = actor.system.skills?.[skillKey];
        const skillLabel = skill.label ?? skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

        // Increment attempts now that the roll has been completed
        await this.incrementRecallAttempts(actorId, targetId);

        // Track creature type for Thorough Reports (only on success or critical success)
        if ((degree === 'success' || degree === 'criticalSuccess') && this.hasThoroughReportsFeat(actor)) {
            this.trackCreatureType(actorId, targetActor);
        }

        // Check settings
        const hideRollFromPlayer = game.settings.get(MODULE_ID, 'hideRollFromPlayer');
        const falseInfoOnCritFail = game.settings.get(MODULE_ID, 'falseInfoOnCritFail');
        const shareWithParty = game.settings.get(MODULE_ID, 'shareWithParty');

        // Calculate number of pieces of information learned
        const infoBreakdown = this.calculateInformationCount(actor, degree, true);
        let infoCount = infoBreakdown.total;
        let isFalseInfo = false;

        // Handle critical failure with false information setting
        if (degree === 'criticalFailure' && falseInfoOnCritFail) {
            infoCount = 1; // Show as if they got 1 piece of information
            isFalseInfo = true;
        }

        // Render the roll tooltip
        const rollHtml = await roll.render();

        // Build information pieces tooltip
        let infoTooltip = '';
        if (infoBreakdown.sources.length > 0) {
            infoTooltip = infoBreakdown.sources.join('\n');
        }

        // Build chat message content
        let chatContent = `
            <div class="recall-knowledge-result ${degree.replace(/([A-Z])/g, '-$1').toLowerCase()}">
                <div class="rk-header">
                    <strong>Recall Knowledge: ${skillLabel}</strong>
                    ${useAssurance && hasAssurance ? '<span class="rk-badge">Assurance</span>' : ''}
                </div>
                <div class="rk-target">Target: <strong>${target.name}</strong></div>
                <div class="rk-dc-line">
                    <span class="rk-dc">DC: <strong>${dc}</strong></span>
                    <span class="rk-degree ${degree.toLowerCase()}">${degree}</span>
                </div>
                ${rollHtml}`;

        if (useAssurance && hasAssurance) {
            chatContent += `<div class="rk-detail">Assurance: 10 + proficiency = ${assuranceValue}</div>`;
        }

        if (thoroughReportsBonus > 0 && !useAssurance) {
            chatContent += `<div class="rk-detail">Thorough Reports: +${thoroughReportsBonus}</div>`;
        }

        chatContent += `<div class="rk-info">
                    <span class="rk-info-label">Information Pieces:</span> 
                    <span class="rk-info-count" title="${infoTooltip}">${infoCount}</span>
                </div>
                <div class="rk-learned" data-actor-id="${actorId}" data-target-id="${targetId}" data-is-false="${isFalseInfo}">
                    <div class="rk-learned-label">What was learned:</div>
                    <div class="rk-learned-content">
                        <em>Selecting information...</em>
                    </div>
                </div>
            </div>
        `;

        // Create chat message
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            content: chatContent,
            roll: roll,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            sound: CONFIG.sounds.dice,
            whisper: game.user.isGM ? [] : game.users.filter(u => u.isGM).map(u => u.id),
            flags: {
                [MODULE_ID]: {
                    actorId: actorId,
                    targetId: targetId,
                    isFalseInfo: isFalseInfo,
                    shareWithParty: shareWithParty
                }
            }
        };

        // Determine who should see the roll result
        if (hideRollFromPlayer) {
            // Only GM sees the roll
            chatData.whisper = game.users.filter(u => u.isGM).map(u => u.id);
        } else if (!game.user.isGM) {
            // Player sees their own roll and GMs see it
            chatData.whisper = [game.user.id, ...game.users.filter(u => u.isGM).map(u => u.id)];
        }

        const chatMessage = await ChatMessage.create(chatData);

        // Show information selection dialog or failure message
        if (infoCount > 0) {
            this.showInformationSelectionDialog(actor, target, infoCount, isFalseInfo, skillKey, chatMessage);
        } else {
            // Failure - notify player
            ui.notifications.info(`You failed to recall any information about ${target.name}.`);

            const failureChat = {
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `<p><em>Failed to recall any information about ${target.name}.</em></p>`,
                whisper: [game.user.id]
            };
            ChatMessage.create(failureChat);
        }
    }

    /**
     * Calculate how many pieces of information the character learns
     * Based on success level and character feats/abilities
     */
    calculateInformationCount(actor, degree, returnBreakdown = false) {
        // Base information count
        let count = 0;
        const sources = [];

        if (degree === 'criticalSuccess') {
            count = 2;
            sources.push('Critical Success: 2 pieces');
        } else if (degree === 'success') {
            count = 1;
            sources.push('Success: 1 piece');
        } else {
            return returnBreakdown ? { total: 0, sources: [] } : 0; // No information on failure or critical failure
        }

        // Check for feats that grant additional information
        const bonusResult = this.checkRecallKnowledgeBonuses(actor, true);

        if (bonusResult.bonus > 0) {
            count += bonusResult.bonus;
            sources.push(...bonusResult.sources);
            console.log(`${MODULE_TITLE} | Actor has +${bonusResult.bonus} bonus information from feats/abilities`);
        }

        return returnBreakdown ? { total: count, sources: sources } : count;
    }

    /**
     * Check actor for feats and effects that grant additional Recall Knowledge information
     */
    checkRecallKnowledgeBonuses(actor, returnSources = false) {
        let bonus = 0;
        const sources = [];

        // List of feat names/slugs that grant additional information
        const bonusFeats = [
            'know-it-all',          // Bard/Thaumaturge feat - grants additional info
            'know it all',          // Eldritch Researcher archetype version
            'thorough research',    // Investigator feat - grants additional info
            'font of knowledge',    // Scrollmaster archetype - grants additional info
            'fountain of secrets'   // Shisk ancestry feat - grants additional info
        ];

        // Check actor's items (feats are stored as items in PF2e)
        if (actor.items) {
            for (const item of actor.items) {
                const itemName = item.name?.toLowerCase() || '';
                const itemSlug = item.system?.slug?.toLowerCase() || '';

                // Check if this is a feat that grants bonus information
                if (item.type === 'feat' || item.type === 'feature') {
                    for (const featName of bonusFeats) {
                        if (itemName.includes(featName) || itemSlug.includes(featName)) {
                            bonus++;
                            sources.push(`${item.name}: +1 piece`);
                            console.log(`${MODULE_TITLE} | Found bonus feat: ${item.name}`);
                            break; // Only count each item once
                        }
                    }
                }
            }
        }

        // Check for active effects that might grant bonuses
        if (actor.effects) {
            for (const effect of actor.effects) {
                const effectName = effect.name?.toLowerCase() || '';
                const effectLabel = effect.label?.toLowerCase() || '';

                // Check for Pocket Library spell or similar effects
                if (effectName.includes('pocket library') || effectLabel.includes('pocket library')) {
                    bonus++;
                    sources.push(`${effect.name || effect.label}: +1 piece`);
                    console.log(`${MODULE_TITLE} | Found bonus effect: ${effect.name || effect.label}`);
                }
            }
        }

        return returnSources ? { bonus: bonus, sources: sources } : bonus;
    }

    /**
     * Show interactive dialog for selecting information to learn
     */
    showInformationSelectionDialog(actor, target, maxCount, isFalseInfo = false, skillKey = null, chatMessage = null) {
        let remainingCount = maxCount;
        const selectedInfo = [];

        // Get previously learned information - use actor ID not token ID
        const targetActor = target.actor || target;
        const targetId = targetActor.id || targetActor.uuid;
        const actorId = actor.id;
        const learnedInfo = this.getLearnedInformation(actorId, targetId);

        const infoOptions = [
            { id: 'highest-save', label: 'Highest Save' },
            { id: 'lowest-save', label: 'Lowest Save' },
            { id: 'resistances', label: 'Resistances' },
            { id: 'weaknesses', label: 'Weaknesses' },
            { id: 'immunities', label: 'Immunities' },
            { id: 'attacks', label: 'Attacks' },
            { id: 'skills', label: 'Skills' },
            { id: 'background', label: 'Creature Background' }
        ];

        const generateContent = () => {
            let html = `
                <div class="recall-knowledge-info-selection">
                    <p style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">
                        Information Pieces Remaining: <span id="remaining-count">${remainingCount}</span>
                    </p>
            `;

            // Show previously learned information if any
            if (learnedInfo.length > 0) {
                const targetActor = target.actor || target;
                html += `
                    <div style="margin-bottom: 16px; padding: 12px; background: #f0f0f0; border-radius: 4px;">
                        <p style="font-weight: bold; margin-bottom: 8px;">Already Learned:</p>
                        <ul style="margin: 0; padding-left: 20px; list-style: none;">
                            ${learnedInfo.map(id => {
                    const option = infoOptions.find(o => o.id === id);
                    const infoValue = this.getInformationValue(targetActor, id);
                    return `<li style="margin-bottom: 4px;"><strong>${option ? option.label : id}:</strong> ${infoValue}</li>`;
                }).join('')}
                        </ul>
                    </div>
                `;
            }

            html += `<p style="margin-bottom: 16px;">Select the information you want to learn about <strong>${target.name}</strong>:</p>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
            `;

            for (const option of infoOptions) {
                const isAlreadyLearned = learnedInfo.includes(option.id);
                const isSelected = selectedInfo.includes(option.id);
                const isDisabled = isAlreadyLearned || (!isSelected && remainingCount === 0);

                html += `
                    <label style="display: flex; align-items: center; padding: 8px; border: 1px solid #999; border-radius: 4px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; background: ${isAlreadyLearned ? '#d0d0d0' : isSelected ? '#e8f4f8' : 'transparent'}; opacity: ${isDisabled ? '0.5' : '1'};">
                        <input 
                            type="checkbox" 
                            name="info-option" 
                            value="${option.id}" 
                            ${isSelected ? 'checked' : ''} 
                            ${isDisabled ? 'disabled' : ''}
                            style="margin-right: 8px;"
                            data-option="${option.id}"
                        >
                        <span style="font-weight: 500;">${option.label}${isAlreadyLearned ? ' (Already Known)' : ''}</span>
                    </label>
                `;
            }

            html += `
                    </div>
                </div>
            `;

            return html;
        };

        const dialog = new Dialog({
            title: 'Select Information to Learn',
            content: generateContent(),
            buttons: {
                confirm: {
                    label: 'Confirm',
                    callback: async (html) => {
                        const checkedBoxes = html.find('input[name="info-option"]:checked');
                        const finalSelection = [];
                        checkedBoxes.each(function () {
                            finalSelection.push($(this).val());
                        });

                        // Store learned information (even if false, so they can't try again to get real info)
                        if (!isFalseInfo) {
                            await this.storeLearnedInformation(actorId, targetId, finalSelection);
                        }

                        this.revealSelectedInformation(actor, target, finalSelection, isFalseInfo, chatMessage);

                        // Check for Diverse Recognition
                        if (skillKey && this.hasDiverseRecognition(actor) && !this.hasDiverseRecognitionBeenUsed(actorId)) {
                            // Check if actor is master in this skill
                            const skill = actor.system.skills?.[skillKey];
                            const isMaster = skill?.rank >= 3; // 3 = Master, 4 = Legendary

                            if (isMaster) {
                                this.offerDiverseRecognition(actor, target, skillKey);
                            }
                        }
                    }
                },
                cancel: {
                    label: 'Cancel'
                }
            },
            default: 'confirm',
            render: (html) => {
                // Add change listeners to checkboxes
                html.find('input[name="info-option"]').on('change', (event) => {
                    const checkbox = $(event.currentTarget);
                    const optionId = checkbox.data('option');

                    if (checkbox.is(':checked')) {
                        if (remainingCount > 0) {
                            selectedInfo.push(optionId);
                            remainingCount--;
                        } else {
                            checkbox.prop('checked', false);
                            return;
                        }
                    } else {
                        const index = selectedInfo.indexOf(optionId);
                        if (index > -1) {
                            selectedInfo.splice(index, 1);
                            remainingCount++;
                        }
                    }

                    // Update remaining count display
                    html.find('#remaining-count').text(remainingCount);

                    // Update disabled state of unchecked boxes
                    html.find('input[name="info-option"]').each(function () {
                        const box = $(this);
                        const boxOptionId = box.data('option');
                        const isAlreadyLearned = learnedInfo.includes(boxOptionId);

                        if (!box.is(':checked')) {
                            // Keep already learned items disabled
                            const shouldDisable = isAlreadyLearned || remainingCount === 0;
                            box.prop('disabled', shouldDisable);
                            box.closest('label').css({
                                'cursor': shouldDisable ? 'not-allowed' : 'pointer',
                                'opacity': shouldDisable ? '0.5' : '1',
                                'background': isAlreadyLearned ? '#d0d0d0' : 'transparent'
                            });
                        }
                    });
                });
            }
        });

        dialog.render(true);
    }

    /**
     * Get learned information for actor-target pair
     */
    getLearnedInformation(actorId, targetId) {
        const shareWithParty = game.settings.get(MODULE_ID, 'shareWithParty');

        if (shareWithParty) {
            // Gather information from all party members in "The Party" actor
            const allLearnedInfo = new Set();

            // Find "The Party" actor (PF2e party system)
            const partyActor = game.actors.find(a => a.type === "party" || a.name === "The Party");
            const partyActors = partyActor?.system?.details?.members ? Array.from(partyActor.system.details.members).map(m => game.actors.get(m.uuid.split('.').pop())) : [];

            for (const partyActor of partyActors) {
                // Check all users for this actor's learned information
                for (const user of game.users) {
                    const userInfo = user.getFlag(MODULE_ID, `learnedInfo.${partyActor.id}.${targetId}`) || [];
                    userInfo.forEach(info => allLearnedInfo.add(info));
                }
            }

            return Array.from(allLearnedInfo);
        } else {
            // Only return current user's learned information
            return game.user.getFlag(MODULE_ID, `learnedInfo.${actorId}.${targetId}`) || [];
        }
    }    /**
     * Store learned information for actor-target pair
     */
    async storeLearnedInformation(actorId, targetId, newInfo) {
        // Get only THIS user's existing info (not party-wide)
        const existing = game.user.getFlag(MODULE_ID, `learnedInfo.${actorId}.${targetId}`) || [];
        const combined = [...new Set([...existing, ...newInfo])]; // Merge and deduplicate
        await game.user.setFlag(MODULE_ID, `learnedInfo.${actorId}.${targetId}`, combined);
        console.log(`${MODULE_TITLE} | Stored learned info for actor ${actorId}, target ${targetId}:`, combined);
        console.log(`${MODULE_TITLE} | Full learnedInfo structure:`, game.user.getFlag(MODULE_ID, 'learnedInfo'));
    }

    /**
     * Get the actual information value for display
     */
    getInformationValue(targetActor, infoId) {
        if (!targetActor || !targetActor.system) return 'Unknown';

        switch (infoId) {
            case 'highest-save':
                return this.getHighestSave(targetActor);
            case 'lowest-save':
                return this.getLowestSave(targetActor);
            case 'resistances':
                return this.getResistances(targetActor) || 'None';
            case 'weaknesses':
                return this.getWeaknesses(targetActor) || 'None';
            case 'immunities':
                return this.getImmunities(targetActor) || 'None';
            case 'attacks':
                return this.getAttacks(targetActor);
            case 'skills':
                return this.getSkills(targetActor);
            case 'background':
                const bg = this.getCreatureBackground(targetActor);
                return bg.length > 100 ? bg.substring(0, 100) + '...' : bg;
            case 'special-attacks':
                return this.getSpecialAttacks(targetActor) || 'None known';
            case 'special-abilities':
                return this.getSpecialAbilities(targetActor) || 'None known';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get number of previous recall knowledge attempts for DC adjustment
     */
    getRecallAttempts(actorId, targetId) {
        return game.user.getFlag(MODULE_ID, `recallAttempts.${actorId}.${targetId}`) || 0;
    }

    /**
     * Set recall knowledge attempts to a specific value (for GM adjustment)
     */
    async setRecallAttempts(actorId, targetId, count) {
        await game.user.setFlag(MODULE_ID, `recallAttempts.${actorId}.${targetId}`, Math.max(0, count));
    }

    /**
     * Increment recall knowledge attempts
     */
    async incrementRecallAttempts(actorId, targetId) {
        const attempts = this.getRecallAttempts(actorId, targetId);
        await game.user.setFlag(MODULE_ID, `recallAttempts.${actorId}.${targetId}`, attempts + 1);
    }

    /**
     * Check if actor has Thorough Reports feat
     */
    hasThoroughReportsFeat(actor) {
        if (!actor.items) return false;
        return actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('thorough reports') ||
                item.slug === 'thorough-reports')
        );
    }

    /**
     * Check if actor has Scrollmaster Dedication feat
     */
    hasScrollmasterDedication(actor) {
        if (!actor.items) return false;
        return actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('scrollmaster dedication') ||
                item.slug === 'scrollmaster-dedication')
        );
    }

    /**
     * Check if actor has Diverse Recognition feat
     */
    hasDiverseRecognition(actor) {
        if (!actor.items) return false;
        return actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('diverse recognition') ||
                item.slug === 'diverse-recognition')
        );
    }

    /**
     * Check if Diverse Recognition was already used this round
     */
    hasDiverseRecognitionBeenUsed(actorId) {
        return game.user.getFlag(MODULE_ID, `diverseRecognition.${actorId}.used`) || false;
    }

    /**
     * Check if actor has Bestiary Scholar feat
     */
    hasBestiaryScholar(actor) {
        if (!actor.items) return false;
        return actor.items.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('bestiary scholar') ||
                item.slug === 'bestiary-scholar')
        );
    }

    /**
     * Mark Diverse Recognition as used this round
     */
    async markDiverseRecognitionUsed(actorId) {
        await game.user.setFlag(MODULE_ID, `diverseRecognition.${actorId}.used`, true);
    }

    /**
     * Reset Diverse Recognition usage (called at start of new round)
     */
    async resetDiverseRecognitionUsage(actorId) {
        await game.user.setFlag(MODULE_ID, `diverseRecognition.${actorId}.used`, false);
    }

    /**
     * Offer to use Diverse Recognition feat
     */
    offerDiverseRecognition(actor, previousTarget, skillKey) {
        const actorId = actor.id;

        // Get all targetable tokens except the one just used
        const previousTargetId = (previousTarget.actor || previousTarget).id;
        const availableTargets = canvas.tokens.placeables.filter(token => {
            const tokenActorId = token.actor?.id;
            return tokenActorId && tokenActorId !== previousTargetId && token.actor;
        });

        if (availableTargets.length === 0) {
            ui.notifications.warn("No other creatures available for Diverse Recognition.");
            return;
        }

        const targetOptions = availableTargets.map(token => {
            return `
                <option value="${token.id}">${token.name}</option>
            `;
        }).join('');

        const skill = actor.system.skills?.[skillKey];
        const skillLabel = skill?.label ?? skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

        const content = `
            <div class="recall-knowledge-dialog">
                <p><strong>Diverse Recognition</strong></p>
                <p>You successfully recalled knowledge about ${previousTarget.name}.</p>
                <p>Would you like to attempt Recall Knowledge on a different creature using ${skillLabel}?</p>
                <p style="margin-top: 12px;">
                    <label for="diverse-target"><strong>Select Target:</strong></label>
                    <select id="diverse-target" style="width: 100%; margin-top: 4px;">
                        ${targetOptions}
                    </select>
                </p>
                <p style="font-size: 0.85em; color: #666; margin-top: 8px;">
                    <em>Frequency: Once per round</em>
                </p>
            </div>
        `;

        new Dialog({
            title: 'Diverse Recognition',
            content: content,
            buttons: {
                yes: {
                    label: 'Use Diverse Recognition',
                    callback: async (html) => {
                        const selectedTokenId = html.find('#diverse-target').val();
                        const selectedToken = canvas.tokens.get(selectedTokenId);

                        if (selectedToken) {
                            // Mark as used
                            await this.markDiverseRecognitionUsed(actorId);

                            // Start recall knowledge on the new target with the same skill
                            this.performRecallKnowledgeRoll(actor, selectedToken, skillKey);
                        }
                    }
                },
                no: {
                    label: 'No Thanks'
                }
            },
            default: 'yes'
        }).render(true);
    }

    /**
     * Get creature trait/type for Thorough Reports tracking
     */
    getCreatureType(targetActor) {
        if (!targetActor?.system?.traits?.value) return null;

        // PF2e creature types (traits)
        const creatureTypes = [
            'aberration', 'animal', 'astral', 'beast', 'celestial', 'construct',
            'dragon', 'elemental', 'ethereal', 'fey', 'fiend', 'fungus',
            'giant', 'humanoid', 'monitor', 'ooze', 'plant', 'undead'
        ];

        const traits = targetActor.system.traits.value || [];

        // Find the first matching creature type trait
        for (const trait of traits) {
            const traitLower = trait.toLowerCase();
            if (creatureTypes.includes(traitLower)) {
                return traitLower;
            }
        }

        return null;
    }

    /**
     * Track creature type for Thorough Reports
     */
    trackCreatureType(actorId, targetActor) {
        const creatureType = this.getCreatureType(targetActor);
        if (!creatureType) return;

        const trackedTypes = game.user.getFlag(MODULE_ID, `thoroughReports.${actorId}`) || [];
        if (!trackedTypes.includes(creatureType)) {
            trackedTypes.push(creatureType);
            game.user.setFlag(MODULE_ID, `thoroughReports.${actorId}`, trackedTypes);
            console.log(`${MODULE_TITLE} | Tracked new creature type for Thorough Reports: ${creatureType}`);
        }
    }

    /**
     * Check if actor gets Thorough Reports bonus against this creature
     */
    checkThoroughReportsBonus(actor, targetActor, skillKey) {
        // Must have the feat
        if (!this.hasThoroughReportsFeat(actor)) {
            return 0;
        }

        // Get creature type
        const creatureType = this.getCreatureType(targetActor);
        if (!creatureType) {
            return 0;
        }

        // Check if we've tracked this type before
        const actorId = actor.id;
        const trackedTypes = game.user.getFlag(MODULE_ID, `thoroughReports.${actorId}`) || [];

        if (!trackedTypes.includes(creatureType)) {
            return 0; // Haven't successfully identified this type before
        }

        // Base bonus is +2
        let bonus = 2;

        // Check for Scrollmaster Dedication (increases to +4 if expert in skill)
        if (this.hasScrollmasterDedication(actor)) {
            const skill = actor.system.skills?.[skillKey];
            const rank = skill?.rank ?? 0;

            // Expert = rank 2, Master = rank 3, Legendary = rank 4
            if (rank >= 2) {
                bonus = 4;
                console.log(`${MODULE_TITLE} | Scrollmaster Dedication increases bonus to +4`);
            }
        }

        return bonus;
    }

    /**
     * Reveal the selected information to the player
     */
    revealSelectedInformation(actor, target, selectedInfoIds, isFalseInfo = false, chatMessage = null) {
        if (selectedInfoIds.length === 0) {
            ui.notifications.info('No information selected.');
            return;
        }

        // Handle both Token objects and Actor objects
        const targetActor = target.actor || target;
        const targetName = target.name || target.actor?.name || 'Unknown';

        if (!targetActor || !targetActor.system) {
            ui.notifications.error('Target actor not found.');
            console.error('Target object:', target);
            return;
        }

        let learnedContent = '';

        for (const infoId of selectedInfoIds) {
            if (isFalseInfo) {
                // Generate false information for critical failure
                learnedContent += this.generateFalseInformation(infoId);
            } else {
                // Generate real information
                switch (infoId) {
                    case 'highest-save':
                        const highestSave = this.getHighestSave(targetActor);
                        learnedContent += `<div class="rk-learned-item"><strong>Highest Save:</strong> ${highestSave}</div>`;
                        break;

                    case 'lowest-save':
                        const lowestSave = this.getLowestSave(targetActor);
                        learnedContent += `<div class="rk-learned-item"><strong>Lowest Save:</strong> ${lowestSave}</div>`;
                        break;

                    case 'resistances':
                        const resistances = this.getResistances(targetActor);
                        learnedContent += `<div class="rk-learned-item"><strong>Resistances:</strong> ${resistances || 'None'}</div>`;
                        break;

                    case 'weaknesses':
                        const weaknesses = this.getWeaknesses(targetActor);
                        learnedContent += `<div class="rk-learned-item"><strong>Weaknesses:</strong> ${weaknesses || 'None'}</div>`;
                        break;

                    case 'immunities':
                        const immunities = this.getImmunities(targetActor);
                        learnedContent += `<div class="rk-learned-item"><strong>Immunities:</strong> ${immunities || 'None'}</div>`;
                        break;

                    case 'attacks':
                        const attacks = this.getAttacks(targetActor);
                        learnedContent += `<div class="rk-learned-item"><strong>Special Attacks:</strong> ${attacks || 'None known'}</div>`;
                        break;

                    case 'special-abilities':
                        const abilities = this.getSpecialAbilities(targetActor);
                        learnedContent += `<div class="rk-learned-item"><strong>Special Abilities:</strong> ${abilities || 'None known'}</div>`;
                        break;
                }
            }
        }

        // If we have a chat message to update, update it
        if (chatMessage) {
            const shareWithParty = game.settings.get(MODULE_ID, 'shareWithParty');

            // Update the learned content in the existing message
            let newContent = chatMessage.content;
            const learnedSection = `<div class="rk-learned-content">${learnedContent}</div>`;
            newContent = newContent.replace(/<div class="rk-learned-content">.*?<\/div>/s, learnedSection);

            // Determine whisper targets based on share setting
            let whisperList;
            if (shareWithParty) {
                // Everyone can see it (no whisper means visible to all)
                whisperList = [];
            } else {
                // Only the player who rolled and GMs can see it
                whisperList = [game.user.id, ...game.users.filter(u => u.isGM).map(u => u.id)];
            }

            chatMessage.update({
                content: newContent,
                whisper: whisperList
            });
        } else {
            // Fallback: create a separate message (old behavior)
            let content = `<h3>Recalled Information about ${targetName}</h3>`;
            content += `<p><em>Learned ${selectedInfoIds.length} piece${selectedInfoIds.length !== 1 ? 's' : ''} of information</em></p>`;
            content += `<div>${learnedContent}</div>`;

            const chatData = {
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor }),
                content: content,
                whisper: [game.user.id]
            };

            ChatMessage.create(chatData);
        }
    }

    /**
     * Generate false information for critical failures
     */
    generateFalseInformation(infoId) {
        const saves = ['Fortitude', 'Reflex', 'Will'];
        const damageTypes = ['fire', 'cold', 'electricity', 'acid', 'poison', 'sonic', 'force', 'negative', 'positive', 'mental', 'slashing', 'piercing', 'bludgeoning'];
        const skillsList = ['Acrobatics', 'Arcana', 'Athletics', 'Crafting', 'Deception', 'Diplomacy', 'Intimidation', 'Medicine', 'Nature', 'Occultism', 'Performance', 'Religion', 'Society', 'Stealth', 'Survival', 'Thievery'];

        const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randomDamageTypes = () => {
            const count = randomNumber(1, 3);
            const selected = [];
            for (let i = 0; i < count; i++) {
                const type = randomElement(damageTypes.filter(t => !selected.includes(t)));
                selected.push(type);
            }
            return selected.join(', ');
        };

        switch (infoId) {
            case 'highest-save':
                return `<div class="rk-learned-item"><strong>Highest Save:</strong> ${randomElement(saves)} (+${randomNumber(5, 25)})</div>`;

            case 'lowest-save':
                return `<div class="rk-learned-item"><strong>Lowest Save:</strong> ${randomElement(saves)} (+${randomNumber(-2, 15)})</div>`;

            case 'resistances':
                return Math.random() > 0.5
                    ? `<div class="rk-learned-item"><strong>Resistances:</strong> ${randomDamageTypes()} ${randomNumber(5, 15)}</div>`
                    : `<div class="rk-learned-item"><strong>Resistances:</strong> None</div>`;

            case 'weaknesses':
                return Math.random() > 0.3
                    ? `<div class="rk-learned-item"><strong>Weaknesses:</strong> ${randomDamageTypes()} ${randomNumber(5, 15)}</div>`
                    : `<div class="rk-learned-item"><strong>Weaknesses:</strong> None</div>`;

            case 'immunities':
                return Math.random() > 0.6
                    ? `<div class="rk-learned-item"><strong>Immunities:</strong> ${randomDamageTypes()}</div>`
                    : `<div class="rk-learned-item"><strong>Immunities:</strong> None</div>`;

            case 'attacks':
                const attackTypes = ['melee', 'ranged'];
                const attackNames = ['claw', 'bite', 'fist', 'tail', 'horn', 'slam', 'tentacle', 'longbow', 'crossbow'];
                const attackCount = randomNumber(1, 3);
                const attacks = [];
                for (let i = 0; i < attackCount; i++) {
                    const type = randomElement(attackTypes);
                    const name = randomElement(attackNames);
                    const bonus = randomNumber(5, 25);
                    const damage = `${randomNumber(1, 3)}d${randomElement([4, 6, 8, 10, 12])}+${randomNumber(0, 10)}`;
                    attacks.push(`${name} (${type} +${bonus}, ${damage} ${randomElement(damageTypes.slice(0, 5))})`);
                }
                return `<div class="rk-learned-item"><strong>Attacks:</strong> ${attacks.join(', ')}</div>`;

            case 'skills':
                const skillCount = randomNumber(2, 5);
                const skills = [];
                for (let i = 0; i < skillCount; i++) {
                    const skill = randomElement(skillsList.filter(s => !skills.some(sk => sk.includes(s))));
                    skills.push(`${skill} +${randomNumber(5, 25)}`);
                }
                return `<div class="rk-learned-item"><strong>Skills:</strong> ${skills.join(', ')}</div>`;

            case 'background':
                const falseBackgrounds = [
                    'This creature is known to be peaceful and rarely attacks.',
                    'Legends say this creature can speak Common fluently.',
                    'This creature is said to be vulnerable during the day.',
                    'Stories tell of this creature\'s ability to turn invisible at will.',
                    'This creature is believed to be attracted to shiny objects.',
                    'Ancient texts claim this creature fears running water.',
                    'This creature is rumored to have exceptional hearing.',
                    'Scholars believe this creature can regenerate lost limbs.'
                ];
                return `<div class="rk-learned-item"><strong>Background:</strong> ${randomElement(falseBackgrounds)}</div>`;

            case 'special-attacks':
                const specialAttacks = [
                    'breath weapon (3d6 fire, DC 20 Reflex)',
                    'paralyzing touch (Fort DC 18)',
                    'death gaze (Will DC 22)',
                    'poison (1d6 poison per round)',
                    'web attack (Reflex DC 16)'
                ];
                return `<div class="rk-learned-item"><strong>Special Attacks:</strong> ${randomElement(specialAttacks)}</div>`;

            case 'special-abilities':
                const specialAbilities = [
                    'darkvision 60 ft., low-light vision',
                    'regeneration 5 (acid or fire)',
                    'spell resistance 15',
                    'telepathy 100 ft.',
                    'tremorsense 30 ft.'
                ];
                return `<div class="rk-learned-item"><strong>Special Abilities:</strong> ${randomElement(specialAbilities)}</div>`;

            default:
                return `<div class="rk-learned-item"><strong>${infoId}:</strong> You recall something, but you're not quite sure what...</div>`;
        }
    }

    /**
     * Helper methods to extract creature information
     */
    getHighestSave(actor) {
        const saves = actor.system.saves || {};
        let highest = { name: 'Unknown', value: -999 };

        for (const [key, save] of Object.entries(saves)) {
            const value = save.totalModifier ?? save.mod ?? save.value ?? 0;
            if (value > highest.value) {
                highest = { name: save.label || key, value: value };
            }
        }

        return `${highest.name} (+${highest.value})`;
    }

    getLowestSave(actor) {
        const saves = actor.system.saves || {};
        let lowest = { name: 'Unknown', value: 999 };

        for (const [key, save] of Object.entries(saves)) {
            const value = save.totalModifier ?? save.mod ?? save.value ?? 0;
            if (value < lowest.value) {
                lowest = { name: save.label || key, value: value };
            }
        }

        return `${lowest.name} (+${lowest.value})`;
    }

    getResistances(actor) {
        const resistances = actor.system.traits?.dr || actor.system.attributes?.resistances || [];
        if (Array.isArray(resistances) && resistances.length > 0) {
            return resistances.map(r => `${r.type} ${r.value}`).join(', ');
        }
        return null;
    }

    getWeaknesses(actor) {
        const weaknesses = actor.system.traits?.dv || actor.system.attributes?.weaknesses || [];
        if (Array.isArray(weaknesses) && weaknesses.length > 0) {
            return weaknesses.map(w => `${w.type} ${w.value}`).join(', ');
        }
        return null;
    }

    getImmunities(actor) {
        const immunities = actor.system.traits?.di || actor.system.attributes?.immunities || [];
        if (Array.isArray(immunities) && immunities.length > 0) {
            return immunities.map(i => i.type || i).join(', ');
        }
        return null;
    }

    getCreatureBackground(actor) {
        return actor.system.details?.publicNotes ||
            actor.system.details?.biography?.value ||
            'No background information available.';
    }

    getSpecialAttacks(actor) {
        const attacks = [];

        // Check for special attack items
        if (actor.items) {
            for (const item of actor.items) {
                if (item.type === 'action' && item.system?.actionType?.value === 'attack') {
                    if (item.system?.traits?.value?.some(t => t.includes('special'))) {
                        attacks.push(item.name);
                    }
                }
            }
        }

        return attacks.length > 0 ? attacks.join(', ') : null;
    }

    getSpecialAbilities(actor) {
        const abilities = [];

        // Check for special abilities
        if (actor.items) {
            for (const item of actor.items) {
                if (item.type === 'action' || item.type === 'feat') {
                    if (item.system?.traits?.value?.some(t => ['reaction', 'free-action'].includes(t))) {
                        abilities.push(item.name);
                    }
                }
            }
        }

        // Limit to first 5 abilities to avoid overwhelming info
        return abilities.length > 0 ? abilities.slice(0, 5).join(', ') : null;
    }

    getAttacks(actor) {
        const attacks = [];

        // Get strike actions from PF2e actor
        if (actor.items) {
            for (const item of actor.items) {
                // Check for melee/weapon items
                if (item.type === 'melee') {
                    const name = item.name;
                    const attackMod = item.system?.bonus?.value ?? '?';

                    // Get damage - PF2e stores damage in system.damageRolls array
                    let damageStr = '?';
                    if (item.system?.damageRolls && Object.keys(item.system.damageRolls).length > 0) {
                        const damageRolls = [];
                        for (const [key, roll] of Object.entries(item.system.damageRolls)) {
                            if (roll.damage) {
                                damageRolls.push(roll.damage);
                            }
                        }
                        damageStr = damageRolls.join(' plus ');
                    }

                    attacks.push(`${name} ${attackMod >= 0 ? '+' : ''}${attackMod} (${damageStr})`);
                }
            }
        }

        return attacks.length > 0 ? attacks.slice(0, 5).join('; ') : 'No attacks found';
    }

    getSkills(actor) {
        const skills = [];

        // Get all trained or better skills
        if (actor.system?.skills) {
            for (const [key, skill] of Object.entries(actor.system.skills)) {
                // For creatures, check if they have a base value (indicating they know the skill)
                // For PCs, rank > 0 indicates trained or better
                const base = skill.base ?? 0;
                const rank = skill.rank ?? 0;

                // Include skill if creature has base value OR PC has training
                if (base > 0 || rank > 0) {
                    const modifier = skill.mod ?? skill.totalModifier ?? skill.value ?? 0;
                    const modifierText = modifier >= 0 ? `+${modifier}` : modifier;
                    const label = skill.label || key.charAt(0).toUpperCase() + key.slice(1);
                    skills.push(`${label} ${modifierText}`);
                }
            }
        }

        return skills.length > 0 ? skills.join(', ') : 'No trained skills';
    }

    revealInformation(target, degree, infoCount = 1) {
        const revealableInfo = game.settings.get(MODULE_ID, 'revealableInfo');
        const infoToReveal = revealableInfo[degree] || [];

        if (infoToReveal.length === 0 || infoCount === 0) {
            return;
        }

        // Limit information revealed to the calculated count
        const limitedInfo = infoToReveal.slice(0, infoCount);

        let content = `<h3>Recalled Information about ${target.name}</h3>`;
        content += `<p><em>Learned ${infoCount} piece${infoCount !== 1 ? 's' : ''} of information</em></p>`;
        content += `<ul>`;

        for (const infoType of limitedInfo) {
            switch (infoType) {
                case 'name':
                    content += `<li><strong>Name:</strong> ${target.name}</li>`;
                    break;
                case 'type':
                    content += `<li><strong>Type:</strong> ${target.actor?.system?.details?.creatureType || 'Unknown'}</li>`;
                    break;
                case 'level':
                    content += `<li><strong>Level:</strong> ${target.actor?.system?.details?.level?.value || 'Unknown'}</li>`;
                    break;
                case 'ac':
                    content += `<li><strong>AC:</strong> ${target.actor?.system?.attributes?.ac?.value || 'Unknown'}</li>`;
                    break;
                case 'hp':
                    content += `<li><strong>HP:</strong> ${target.actor?.system?.attributes?.hp?.max || 'Unknown'}</li>`;
                    break;
                case 'traits':
                    const traits = target.actor?.system?.traits?.value || [];
                    if (traits.length > 0) {
                        content += `<li><strong>Traits:</strong> ${traits.join(', ')}</li>`;
                    }
                    break;
            }
        }

        content += '</ul>';

        const chatData = {
            user: game.user.id,
            content: content,
            whisper: [game.user.id]
        };

        ChatMessage.create(chatData);
    }
}

/**
 * Configuration dialog for Thorough Reports creature types
 */
class ThoroughReportsConfig extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'thorough-reports-config',
            title: 'Thorough Reports - Creature Types',
            template: null, // Use custom rendering instead
            width: 500,
            height: 'auto',
            closeOnSubmit: true
        });
    }

    getData() {
        // Get actor
        let actor = null;
        const controlled = canvas.tokens?.controlled;
        if (controlled && controlled.length > 0) {
            actor = controlled[0].actor;
        } else {
            actor = game.user.character;
        }

        if (!actor) {
            return { error: 'No character selected', creatureTypes: [] };
        }

        const actorId = actor.id;
        const trackedTypes = game.user.getFlag(MODULE_ID, `thoroughReports.${actorId}`) || [];

        // PF2e creature types
        const allCreatureTypes = [
            { key: 'aberration', label: 'Aberration' },
            { key: 'animal', label: 'Animal' },
            { key: 'astral', label: 'Astral' },
            { key: 'beast', label: 'Beast' },
            { key: 'celestial', label: 'Celestial' },
            { key: 'construct', label: 'Construct' },
            { key: 'dragon', label: 'Dragon' },
            { key: 'elemental', label: 'Elemental' },
            { key: 'ethereal', label: 'Ethereal' },
            { key: 'fey', label: 'Fey' },
            { key: 'fiend', label: 'Fiend' },
            { key: 'fungus', label: 'Fungus' },
            { key: 'giant', label: 'Giant' },
            { key: 'humanoid', label: 'Humanoid' },
            { key: 'monitor', label: 'Monitor' },
            { key: 'ooze', label: 'Ooze' },
            { key: 'plant', label: 'Plant' },
            { key: 'undead', label: 'Undead' }
        ];

        const creatureTypes = allCreatureTypes.map(type => ({
            ...type,
            tracked: trackedTypes.includes(type.key)
        }));

        // Check if actor has Thorough Reports feat
        const hasFeat = actor?.items?.some(item =>
            item.type === 'feat' &&
            (item.name.toLowerCase().includes('thorough reports') ||
                item.slug === 'thorough-reports')
        );

        return {
            error: null,
            actorName: actor.name,
            actorId: actorId,
            hasFeat: hasFeat,
            creatureTypes: creatureTypes
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        // Get actor
        let actor = null;
        const controlled = canvas.tokens?.controlled;
        if (controlled && controlled.length > 0) {
            actor = controlled[0].actor;
        } else {
            actor = game.user.character;
        }

        if (!actor) {
            ui.notifications.error('No character selected.');
            return;
        }

        const actorId = actor.id;
        const trackedTypes = [];

        // Collect all checked creature types
        for (const [key, value] of Object.entries(formData)) {
            if (key.startsWith('type-') && value === true) {
                const typeKey = key.replace('type-', '');
                trackedTypes.push(typeKey);
            }
        }

        // Save to user flags
        await game.user.setFlag(MODULE_ID, `thoroughReports.${actorId}`, trackedTypes);
        ui.notifications.info(`Thorough Reports creature types updated for ${actor.name}.`);
    }

    render(force, options) {
        // Skip template loading, go directly to inline dialog
        this._renderInline();
        return this;
    }

    async _renderInline() {
        // Check if we have a character selected
        let actor = null;
        const controlled = canvas.tokens?.controlled;
        if (controlled && controlled.length > 0) {
            actor = controlled[0].actor;
        } else {
            actor = game.user.character;
        }

        if (!actor) {
            new Dialog({
                title: 'Thorough Reports Configuration',
                content: '<p>Please select a character token or assign a character to your user to configure Thorough Reports.</p>',
                buttons: {
                    ok: { label: 'OK' }
                }
            }).render(true);
            return;
        }

        const data = this.getData();

        if (data.error) {
            new Dialog({
                title: 'Thorough Reports Configuration',
                content: `<p>${data.error}</p>`,
                buttons: {
                    ok: { label: 'OK' }
                }
            }).render(true);
            return;
        }

        let content = '<form style="padding: 8px;">';

        if (!data.hasFeat) {
            content += '<p style="color: #856404; background: #fff3cd; padding: 8px; border: 1px solid #ffc107; border-radius: 4px; margin-bottom: 12px;">';
            content += '<strong>Note:</strong> Your character does not have the Thorough Reports feat. This configuration will have no effect.';
            content += '</p>';
        }

        content += `<p><strong>Character:</strong> ${data.actorName}</p>`;
        content += '<p style="margin-bottom: 12px;">Select the creature types you have successfully identified with Recall Knowledge to gain the Thorough Reports bonus (+2, or +4 with Scrollmaster Dedication) on future checks:</p>';
        content += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">';

        for (const type of data.creatureTypes) {
            content += `
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" name="type-${type.key}" ${type.tracked ? 'checked' : ''} style="margin-right: 8px;">
                    <span>${type.label}</span>
                </label>
            `;
        }

        content += '</div></form>';

        new Dialog({
            title: 'Thorough Reports - Creature Types',
            content: content,
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Save',
                    callback: async (html) => {
                        const formData = {};
                        html.find('input[type="checkbox"]').each(function () {
                            const name = $(this).attr('name');
                            formData[name] = $(this).is(':checked');
                        });
                        await this._updateObject(null, formData);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: 'save'
        }, {
            width: 500
        }).render(true);
    }
}

/**
 * Configuration dialog for Bestiary Scholar feat
 */
// Initialize module when ready
let recallKnowledgeModule;

Hooks.once('init', () => {
    recallKnowledgeModule = new RecallKnowledgeModule();
});

Hooks.once('ready', () => {
    if (recallKnowledgeModule) {
        recallKnowledgeModule.initialize();
    }
});

// Reset Diverse Recognition usage at the start of each round
Hooks.on('combatRound', async (combat, updateData, updateOptions) => {
    if (!recallKnowledgeModule) return;

    // Reset for all actors in the combat
    for (const combatant of combat.combatants) {
        if (combatant.actor) {
            await recallKnowledgeModule.recallKnowledgeManager.resetDiverseRecognitionUsage(combatant.actor.id);
        }
    }

    console.log(`${MODULE_TITLE} | Reset Diverse Recognition usage for new round`);
});

console.log('Recall Knowledge module loaded');