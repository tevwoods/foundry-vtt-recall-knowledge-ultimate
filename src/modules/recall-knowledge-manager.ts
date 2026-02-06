/**
 * Recall Knowledge Manager
 * Handles the complete recall knowledge workflow including GM approval and information revelation
 */


export interface RecallKnowledgeRequest {
    id: string;
    playerId: string;
    playerName: string;
    actorId: string;
    targetId: string;
    targetName: string;
    timestamp: number;
    availableSkills: KnowledgeSkill[];
}

export interface KnowledgeSkill {
    key: string;
    name: string;
    modifier: number;
    isLore: boolean;
}

export interface RecallKnowledgeResult {
    success: boolean;
    degree: 'criticalFailure' | 'failure' | 'success' | 'criticalSuccess';
    roll: any;
    total: number;
    dc: number;
    skill: KnowledgeSkill;
    availableInfo: CreatureInformation[];
}

export interface CreatureInformation {
    category: string;
    label: string;
    value: string;
    requiresSuccess: boolean;
    requiresCriticalSuccess: boolean;
    gmOnly: boolean;
    revealed: boolean;
}

export class RecallKnowledgeManager {
    private pendingRequests: Map<string, RecallKnowledgeRequest> = new Map();

    /**
     * Initiate a recall knowledge check from a player
     */
    public async initiateRecallKnowledge(actor: any, target: any): Promise<void> {
        // Validate inputs
        if (!actor || !target) {
            ui.notifications.error(game.i18n.localize('recall-knowledge.errors.noTarget'));
            return;
        }

        // Check if GM approval is required
        const settings = (game as any).RecallKnowledge?.settings;
        if (settings?.requiresGMApproval() && !game.user.isGM) {
            await this.requestGMApproval(actor, target);
        } else {
            // Direct roll without GM approval
            await this.showSkillSelectionDialog(actor, target);
        }
    }

    /**
     * Request GM approval for recall knowledge
     */
    private async requestGMApproval(actor: any, target: any): Promise<void> {
        const requestId = foundry.utils.randomID();
        const availableSkills = this.getAvailableSkills(actor);

        const request: RecallKnowledgeRequest = {
            id: requestId,
            playerId: game.user.id,
            playerName: game.user.name,
            actorId: actor.id,
            targetId: target.id,
            targetName: target.name,
            timestamp: Date.now(),
            availableSkills
        };

        this.pendingRequests.set(requestId, request);

        // Send request to GM via socket
        const socketHandler = (game as any).RecallKnowledge?.module?.socketHandler;
        if (socketHandler) {
            socketHandler.sendMessage('gmApprovalRequest', request, this.getGMUserIds());
        }

        ui.notifications.info(`Recall Knowledge request sent to GM for ${target.name}`);
    }

    /**
     * Show GM approval dialog
     */
    public async showGMApprovalDialog(request: RecallKnowledgeRequest): Promise<void> {
        if (!game.user.isGM) return;

        const target = game.actors.get(request.targetId);
        if (!target) return;

        const content = this.generateGMApprovalHTML(request, target);

        new Dialog({
            title: game.i18n.localize('recall-knowledge.ui.gmApproval.title'),
            content,
            buttons: {
                approve: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('recall-knowledge.ui.gmApproval.approve'),
                    callback: (html: any) => this.approveRequest(request, html)
                },
                deny: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('recall-knowledge.ui.gmApproval.deny'),
                    callback: () => this.denyRequest(request)
                }
            },
            default: 'approve',
            close: () => this.denyRequest(request)
        }).render(true);
    }

    /**
     * Approve GM request and initiate roll
     */
    private async approveRequest(request: RecallKnowledgeRequest, html: any): Promise<void> {
        const selectedSkillKey = html.find('[name="selectedSkill"]:checked').val();
        const customDC = parseInt(html.find('[name="customDC"]').val()) || null;

        const selectedSkill = request.availableSkills.find(s => s.key === selectedSkillKey);
        if (!selectedSkill) return;

        const actor = game.actors.get(request.actorId);
        const target = game.actors.get(request.targetId);
        if (!actor || !target) return;

        // Perform the roll  
        const result = await this.performRecallKnowledgeRoll(actor, target, selectedSkill, customDC || undefined);

        // Send result back to player
        const socketHandler = (game as any).RecallKnowledge?.module?.socketHandler;
        if (socketHandler) {
            socketHandler.sendMessage('recallKnowledgeResult', {
                requestId: request.id,
                result
            }, [request.playerId]);
        }

        // Show information selection to GM if successful
        if (result.success) {
            await this.showInformationSelectionDialog(target, result, request.playerId);
        }

        this.pendingRequests.delete(request.id);
    }

    /**
     * Deny GM request
     */
    private denyRequest(request: RecallKnowledgeRequest): void {
        const socketHandler = (game as any).RecallKnowledge?.module?.socketHandler;
        if (socketHandler) {
            socketHandler.sendMessage('recallKnowledgeDenied', {
                requestId: request.id,
                reason: 'GM denied the request'
            }, [request.playerId]);
        }

        this.pendingRequests.delete(request.id);
    }

    /**
     * Show skill selection dialog (for direct rolls)
     */
    private async showSkillSelectionDialog(actor: any, target: any): Promise<void> {
        const availableSkills = this.getAvailableSkills(actor);

        const content = await renderTemplate('modules/recall-knowledge/templates/skill-selection.hbs', {
            actor,
            target,
            skills: availableSkills
        });

        new Dialog({
            title: game.i18n.localize('recall-knowledge.ui.knowledgeCheck.title'),
            content,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-dice-d20"></i>',
                    label: game.i18n.localize('recall-knowledge.ui.knowledgeCheck.roll'),
                    callback: (html: any) => this.handleDirectRoll(actor, target, html)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('recall-knowledge.ui.knowledgeCheck.cancel'),
                    callback: () => { }
                }
            },
            default: 'roll'
        }).render(true);
    }

    /**
     * Handle direct roll without GM approval
     */
    private async handleDirectRoll(actor: any, target: any, html: any): Promise<void> {
        const selectedSkillKey = html.find('[name="selectedSkill"]:checked').val();
        const availableSkills = this.getAvailableSkills(actor);
        const selectedSkill = availableSkills.find(s => s.key === selectedSkillKey);

        if (!selectedSkill) return;

        const result = await this.performRecallKnowledgeRoll(actor, target, selectedSkill);

        if (result.success && game.user.isGM) {
            await this.showInformationSelectionDialog(target, result);
        }
    }

    /**
     * Perform the actual recall knowledge roll
     */
    private async performRecallKnowledgeRoll(
        actor: any,
        target: any,
        skill: KnowledgeSkill,
        customDC?: number
    ): Promise<RecallKnowledgeResult> {
        const dc = customDC || this.calculateDefaultDC(target);

        // Create the roll
        const roll = new Roll(`1d20 + ${skill.modifier}`);
        await roll.evaluate();

        const total = roll.total || 0;
        const margin = total - dc;

        let degree: 'criticalFailure' | 'failure' | 'success' | 'criticalSuccess';
        if (margin >= 10) degree = 'criticalSuccess';
        else if (margin >= 0) degree = 'success';
        else if (margin >= -10) degree = 'failure';
        else degree = 'criticalFailure';

        const success = degree === 'success' || degree === 'criticalSuccess';

        // Create chat message for the roll
        await this.createRollChatMessage(actor, target, skill, roll, dc, degree);

        // Get available information based on success
        const availableInfo = success ? this.getAvailableInformation(target, degree === 'criticalSuccess') : [];

        return {
            success,
            degree,
            roll,
            total,
            dc,
            skill,
            availableInfo
        };
    }

    /**
     * Show information selection dialog to GM
     */
    private async showInformationSelectionDialog(
        target: any,
        result: RecallKnowledgeResult,
        playerId?: string
    ): Promise<void> {
        const content = await renderTemplate('modules/recall-knowledge/templates/information-selection.hbs', {
            target,
            result,
            information: result.availableInfo
        });

        new Dialog({
            title: game.i18n.localize('recall-knowledge.ui.informationReveal.title'),
            content,
            buttons: {
                revealSelected: {
                    icon: '<i class="fas fa-eye"></i>',
                    label: game.i18n.localize('recall-knowledge.ui.informationReveal.revealSelected'),
                    callback: (html: any) => this.revealSelectedInformation(target, result, html, playerId)
                },
                revealAll: {
                    icon: '<i class="fas fa-eye-slash"></i>',
                    label: game.i18n.localize('recall-knowledge.ui.informationReveal.revealAll'),
                    callback: () => this.revealAllInformation(target, result, playerId)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('recall-knowledge.ui.informationReveal.cancel'),
                    callback: () => { }
                }
            },
            default: 'revealSelected'
        }).render(true);
    }

    /**
     * Reveal selected information to player
     */
    private async revealSelectedInformation(
        target: any,
        result: RecallKnowledgeResult,
        html: any,
        playerId?: string
    ): Promise<void> {
        const selectedInfo = [];
        html.find('[name="selectedInfo"]:checked').each((i: number, el: HTMLElement) => {
            const index = parseInt($(el).val() as string);
            if (result.availableInfo[index]) {
                selectedInfo.push(result.availableInfo[index]);
            }
        });

        await this.createInformationChatMessage(target, selectedInfo, playerId);
    }

    /**
     * Reveal all available information to player
     */
    private async revealAllInformation(
        target: any,
        result: RecallKnowledgeResult,
        playerId?: string
    ): Promise<void> {
        await this.createInformationChatMessage(target, result.availableInfo, playerId);
    }

    /**
     * Get available skills for an actor
     */
    private getAvailableSkills(actor: any): KnowledgeSkill[] {
        const skills: KnowledgeSkill[] = [];
        const settings = (game as any).RecallKnowledge?.settings;

        // Standard knowledge skills
        const knowledgeSkills = ['arcana', 'nature', 'occultism', 'religion', 'crafting'];

        for (const skillKey of knowledgeSkills) {
            const skill = actor.system?.skills?.[skillKey];
            if (skill) {
                skills.push({
                    key: skillKey,
                    name: game.i18n.localize(`recall-knowledge.ui.knowledgeCheck.${skillKey}`),
                    modifier: skill.mod || 0,
                    isLore: false
                });
            }
        }

        // Add lore skills if enabled
        if (settings?.shouldIncludeLoreSkills()) {
            const loreSkills = this.getLoreSkills(actor);
            skills.push(...loreSkills);
        }

        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get lore skills for an actor
     */
    private getLoreSkills(actor: any): KnowledgeSkill[] {
        const loreSkills: KnowledgeSkill[] = [];

        // This would need to be adapted based on the game system
        // For PF2e, lore skills are in actor.system.skills and have 'lore' in their key
        if (actor.system?.skills) {
            for (const [key, skill] of Object.entries(actor.system.skills)) {
                if (key.includes('lore') && (skill as any).mod !== undefined) {
                    loreSkills.push({
                        key,
                        name: (skill as any).name || key,
                        modifier: (skill as any).mod || 0,
                        isLore: true
                    });
                }
            }
        }

        return loreSkills;
    }

    /**
     * Calculate default DC for a creature
     */
    private calculateDefaultDC(target: any): number {
        const settings = (game as any).RecallKnowledge?.settings;

        if (!settings?.shouldAutoCalculateDC()) {
            return 15; // Default DC
        }

        const method = settings.getDCCalculationMethod();
        let level = 0;

        switch (method) {
            case 'level':
                level = target.system?.level?.value || target.system?.details?.level?.value || 0;
                break;
            case 'cr':
                level = target.system?.details?.cr || target.system?.cr || 0;
                break;
            default:
                level = 0;
        }

        // Basic DC calculation: 10 + level
        return Math.max(10, 10 + level);
    }

    /**
     * Get available information about a creature
     */
    private getAvailableInformation(target: any, criticalSuccess: boolean): CreatureInformation[] {
        const settings = (game as any).RecallKnowledge?.settings;
        const revealableInfo = settings?.getRevealableInfo() || {};
        const information: CreatureInformation[] = [];

        // Basic Information
        if (revealableInfo.basicInfo?.visible) {
            information.push({
                category: 'basic',
                label: 'Name and Type',
                value: `${target.name} (${target.system?.traits?.value?.join(', ') || 'Unknown type'})`,
                requiresSuccess: false,
                requiresCriticalSuccess: false,
                gmOnly: revealableInfo.basicInfo.gmOnly,
                revealed: false
            });
        }

        // AC Information
        if (revealableInfo.ac?.visible) {
            const ac = target.system?.attributes?.ac?.value || target.system?.ac?.value || 'Unknown';
            information.push({
                category: 'defense',
                label: 'Armor Class',
                value: `AC ${ac}`,
                requiresSuccess: true,
                requiresCriticalSuccess: false,
                gmOnly: revealableInfo.ac.gmOnly,
                revealed: false
            });
        }

        // Resistances and Immunities
        if (revealableInfo.resistances?.visible) {
            const resistances = this.getResistancesText(target);
            if (resistances) {
                information.push({
                    category: 'defense',
                    label: 'Resistances/Immunities',
                    value: resistances,
                    requiresSuccess: true,
                    requiresCriticalSuccess: false,
                    gmOnly: revealableInfo.resistances.gmOnly,
                    revealed: false
                });
            }
        }

        // Weaknesses
        if (revealableInfo.weaknesses?.visible) {
            const weaknesses = this.getWeaknessesText(target);
            if (weaknesses) {
                information.push({
                    category: 'defense',
                    label: 'Weaknesses',
                    value: weaknesses,
                    requiresSuccess: true,
                    requiresCriticalSuccess: false,
                    gmOnly: revealableInfo.weaknesses.gmOnly,
                    revealed: false
                });
            }
        }

        // Saving Throws (Critical Success only)
        if (revealableInfo.saves?.visible && criticalSuccess) {
            const saves = this.getSavesText(target);
            if (saves) {
                information.push({
                    category: 'defense',
                    label: 'Saving Throws',
                    value: saves,
                    requiresSuccess: false,
                    requiresCriticalSuccess: true,
                    gmOnly: revealableInfo.saves.gmOnly,
                    revealed: false
                });
            }
        }

        return information;
    }

    /**
     * Get resistances text for a creature
     */
    private getResistancesText(target: any): string {
        // This would need to be adapted based on the game system
        const resistances = target.system?.traits?.dr || target.system?.resistances || [];
        const immunities = target.system?.traits?.di || target.system?.immunities || [];

        const parts = [];
        if (resistances.length > 0) parts.push(`Resistance: ${resistances.join(', ')}`);
        if (immunities.length > 0) parts.push(`Immunity: ${immunities.join(', ')}`);

        return parts.join('; ');
    }

    /**
     * Get weaknesses text for a creature
     */
    private getWeaknessesText(target: any): string {
        // This would need to be adapted based on the game system
        const weaknesses = target.system?.traits?.dv || target.system?.weaknesses || [];
        return weaknesses.length > 0 ? `Weakness: ${weaknesses.join(', ')}` : '';
    }

    /**
     * Get saving throws text for a creature
     */
    private getSavesText(target: any): string {
        // This would need to be adapted based on the game system
        const saves = target.system?.saves || {};
        const saveTexts = [];

        for (const [save, data] of Object.entries(saves)) {
            if ((data as any).value !== undefined) {
                saveTexts.push(`${save.toUpperCase()}: +${(data as any).value}`);
            }
        }

        return saveTexts.join(', ');
    }

    /**
     * Create chat message for the roll result
     */
    private async createRollChatMessage(
        actor: any,
        target: any,
        skill: KnowledgeSkill,
        roll: any,
        dc: number,
        degree: string
    ): Promise<void> {
        const content = `
      <div class="recall-knowledge-roll">
        <h3>${actor.name} attempts to recall knowledge about ${target.name}</h3>
        <div class="roll-details">
          <p><strong>Skill:</strong> ${skill.name}</p>
          <p><strong>Result:</strong> ${degree}</p>
          <div class="dice-roll">
            ${roll.result} = ${roll.total} vs DC ${dc}
          </div>
        </div>
      </div>
    `;

        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            content,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            roll,
            sound: CONFIG.sounds.dice
        });
    }

    /**
     * Create chat message for revealed information
     */
    private async createInformationChatMessage(
        target: any,
        information: CreatureInformation[],
        playerId?: string
    ): Promise<void> {
        if (information.length === 0) return;

        const content = `
      <div class="recall-knowledge-information">
        <h3>Knowledge about ${target.name}</h3>
        <ul>
          ${information.map(info => `<li><strong>${info.label}:</strong> ${info.value}</li>`).join('')}
        </ul>
      </div>
    `;

        const messageData: any = {
            user: game.user.id,
            content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        };

        // Whisper to specific player if specified
        if (playerId) {
            messageData.whisper = [playerId];
        }

        await ChatMessage.create(messageData);
    }

    /**
     * Get GM user IDs
     */
    private getGMUserIds(): string[] {
        return game.users.filter((user: any) => user.isGM).map((user: any) => user.id);
    }

    /**
     * Generate HTML for GM approval dialog
     */
    private generateGMApprovalHTML(request: RecallKnowledgeRequest, target: any): string {
        const skillsHTML = request.availableSkills.map((skill, index) =>
            `<div>
        <input type="radio" name="selectedSkill" value="${skill.key}" id="skill-${index}" ${index === 0 ? 'checked' : ''}>
        <label for="skill-${index}">${skill.name} (+${skill.modifier})</label>
      </div>`
        ).join('');

        return `
      <div class="recall-knowledge-gm-approval">
        <p><strong>${request.playerName}</strong> wants to recall knowledge about <strong>${target.name}</strong></p>
        
        <div class="form-group">
          <label>Select which skill the player should use:</label>
          <div class="skill-selection">
            ${skillsHTML}
          </div>
        </div>

        <div class="form-group">
          <label for="customDC">Custom DC (optional):</label>
          <input type="number" name="customDC" id="customDC" value="${this.calculateDefaultDC(target)}" min="5" max="50">
        </div>
      </div>
    `;
    }

    /**
     * Generate HTML for skill selection dialog
     */
    private generateSkillSelectionHTML(actor: any, target: any, skills: KnowledgeSkill[]): string {
        const skillsHTML = skills.map((skill, index) =>
            `<div>
        <input type="radio" name="selectedSkill" value="${skill.key}" id="skill-${index}" ${index === 0 ? 'checked' : ''}>
        <label for="skill-${index}">${skill.name} (+${skill.modifier})</label>
      </div>`
        ).join('');

        return `
      <div class="recall-knowledge-skill-selection">
        <p>Select a knowledge skill to use against <strong>${target.name}</strong>:</p>
        
        <div class="form-group">
          <div class="skill-selection">
            ${skillsHTML}
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Generate HTML for information selection dialog
     */
    private generateInformationSelectionHTML(target: any, result: RecallKnowledgeResult): string {
        const infoHTML = result.availableInfo.map((info, index) =>
            `<div>
        <input type="checkbox" name="selectedInfo" value="${index}" id="info-${index}" checked>
        <label for="info-${index}">
          <strong>${info.label}:</strong> ${info.value}
          ${info.gmOnly ? ' <em>(GM Only)</em>' : ''}
        </label>
      </div>`
        ).join('');

        return `
      <div class="recall-knowledge-info-selection">
        <p>Choose what to reveal from the <strong>${result.degree}</strong> recall knowledge check:</p>
        
        <div class="form-group">
          <div class="info-selection">
            ${infoHTML}
          </div>
        </div>
      </div>
    `;
    }
}