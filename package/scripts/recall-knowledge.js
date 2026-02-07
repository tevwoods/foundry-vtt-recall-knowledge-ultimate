var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const MODULE_ID = "recall-knowledge";
const MODULE_TITLE = "Recall Knowledge";
class ModuleAPI {
  constructor() {
    __publicField(this, "rulesEngine");
    __publicField(this, "socketHandler");
    __publicField(this, "settings");
  }
  /**
   * Setup the API for external access
   */
  setupAPI() {
    console.log(`${MODULE_ID} | Setting up module API`);
    const api = {
      moduleId: MODULE_ID,
      version: this.getModuleVersion(),
      settings: {
        get: (key) => {
          var _a;
          return (_a = this.settings) == null ? void 0 : _a.getSetting(key);
        },
        set: (key, value) => {
          var _a;
          return ((_a = this.settings) == null ? void 0 : _a.setSetting(key, value)) || Promise.resolve(void 0);
        },
        isRulesEngineEnabled: () => {
          var _a;
          return ((_a = this.settings) == null ? void 0 : _a.isRulesEngineEnabled()) || false;
        },
        isDebugMode: () => {
          var _a;
          return ((_a = this.settings) == null ? void 0 : _a.isDebugMode()) || false;
        }
      },
      rules: {
        addRuleElement: (element) => {
          var _a;
          return (_a = this.rulesEngine) == null ? void 0 : _a.addRuleElement(element);
        },
        removeRuleElement: (key) => {
          var _a;
          return ((_a = this.rulesEngine) == null ? void 0 : _a.removeRuleElement(key)) || false;
        },
        getRuleElement: (key) => {
          var _a;
          return (_a = this.rulesEngine) == null ? void 0 : _a.getRuleElement(key);
        },
        getAllRuleElements: () => {
          var _a;
          return ((_a = this.rulesEngine) == null ? void 0 : _a.getAllRuleElements()) || [];
        },
        createKnowledgeRule: (config) => this.createKnowledgeRule(config),
        createModifierRule: (config) => this.createModifierRule(config)
      },
      socket: {
        shareKnowledgeCheck: (actorId, checkType, result) => {
          var _a;
          return (_a = this.socketHandler) == null ? void 0 : _a.shareKnowledgeCheck(actorId, checkType, result);
        },
        shareKnowledge: (knowledge, targetActorId, targets) => {
          var _a;
          return (_a = this.socketHandler) == null ? void 0 : _a.shareKnowledge(knowledge, targetActorId, targets);
        },
        updateRules: (ruleElement, action) => {
          var _a;
          return (_a = this.socketHandler) == null ? void 0 : _a.updateRules(ruleElement, action);
        }
      },
      knowledge: {
        performCheck: (actor, checkType, options) => this.performKnowledgeCheck(actor, checkType, options),
        getKnownInformation: (actor) => this.getKnownInformation(actor),
        addKnowledge: (actor, knowledge) => this.addKnowledge(actor, knowledge),
        removeKnowledge: (actor, knowledgeId) => this.removeKnowledge(actor, knowledgeId)
      },
      utils: {
        isKnowledgeSkill: (skill) => this.isKnowledgeSkill(skill),
        getDCForCreature: (creature) => this.getDCForCreature(creature),
        formatKnowledgeResult: (result) => this.formatKnowledgeResult(result)
      }
    };
    globalThis.RecallKnowledgeAPI = api;
    game.RecallKnowledge = api;
    console.log(`${MODULE_ID} | API registered globally as RecallKnowledgeAPI and game.RecallKnowledge`);
  }
  /**
   * Set references to other module components
   */
  setComponents(rulesEngine, socketHandler, settings) {
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
  getModuleVersion() {
    const module = game.modules.get(MODULE_ID);
    return (module == null ? void 0 : module.version) || "1.0.0";
  }
  /**
   * Create a knowledge rule element with defaults
   */
  createKnowledgeRule(config) {
    return {
      key: config.key || "knowledge.custom",
      label: config.label || "Custom Knowledge Check",
      selector: config.selector || "check",
      dc: config.dc || 15,
      type: config.type || "arcana",
      priority: config.priority || 10,
      success: config.success || "You recall some information.",
      criticalSuccess: config.criticalSuccess || "You recall detailed information.",
      failure: config.failure || "You cannot recall anything useful.",
      criticalFailure: config.criticalFailure || "You recall false information.",
      ...config
    };
  }
  /**
   * Create a modifier rule element with defaults
   */
  createModifierRule(config) {
    return {
      key: config.key || "modifier.custom",
      label: config.label || "Custom Modifier",
      selector: config.selector || "skill-check",
      type: config.type || "circumstance",
      value: config.value || 0,
      priority: config.priority || 20,
      ...config
    };
  }
  /**
   * Perform a knowledge check
   */
  async performKnowledgeCheck(actor, checkType, options = {}) {
    var _a, _b;
    console.log(`${MODULE_ID} | Performing knowledge check: ${checkType} for ${actor.name}`);
    if (!actor || !checkType) {
      throw new Error("Actor and checkType are required for knowledge checks");
    }
    if (!this.isKnowledgeSkill(checkType)) {
      throw new Error(`${checkType} is not a valid knowledge skill`);
    }
    const skillModifier = this.getSkillModifier(actor, checkType);
    const dc = options.dc || this.getDCForCreature(options.target);
    const roll = new Roll(`1d20 + ${skillModifier}`);
    await roll.evaluate();
    const total = roll.total || 0;
    const result = this.evaluateKnowledgeResult(total, dc);
    const checkResult = {
      actor: actor.id,
      checkType,
      roll,
      total,
      dc,
      result,
      timestamp: Date.now()
    };
    if ((_a = this.settings) == null ? void 0 : _a.getSetting("shareKnowledge")) {
      (_b = this.socketHandler) == null ? void 0 : _b.shareKnowledgeCheck(actor.id, checkType, checkResult);
    }
    return checkResult;
  }
  /**
   * Get known information for an actor
   */
  getKnownInformation(actor) {
    const knowledgeFlag = actor.getFlag(MODULE_ID, "knownInformation") || [];
    return knowledgeFlag;
  }
  /**
   * Add knowledge to an actor
   */
  addKnowledge(actor, knowledge) {
    const currentKnowledge = this.getKnownInformation(actor);
    const updatedKnowledge = [...currentKnowledge, { ...knowledge, id: foundry.utils.randomID() }];
    actor.setFlag(MODULE_ID, "knownInformation", updatedKnowledge);
  }
  /**
   * Remove knowledge from an actor
   */
  removeKnowledge(actor, knowledgeId) {
    const currentKnowledge = this.getKnownInformation(actor);
    const filteredKnowledge = currentKnowledge.filter((k) => k.id !== knowledgeId);
    if (filteredKnowledge.length !== currentKnowledge.length) {
      actor.setFlag(MODULE_ID, "knownInformation", filteredKnowledge);
      return true;
    }
    return false;
  }
  /**
   * Check if a skill is a knowledge skill
   */
  isKnowledgeSkill(skill) {
    const knowledgeSkills = ["arcana", "nature", "occultism", "religion", "crafting", "lore"];
    return knowledgeSkills.includes(skill.toLowerCase());
  }
  /**
   * Get DC for a creature (simplified implementation)
   */
  getDCForCreature(creature) {
    var _a, _b;
    if (!creature) return 15;
    const level = ((_b = (_a = creature.system) == null ? void 0 : _a.level) == null ? void 0 : _b.value) || 0;
    return 10 + level;
  }
  /**
   * Format knowledge check result
   */
  formatKnowledgeResult(result) {
    if (!result) return "";
    const { checkType, total, dc, result: outcome } = result;
    return `${checkType.charAt(0).toUpperCase() + checkType.slice(1)} Check: ${total} vs DC ${dc} (${outcome})`;
  }
  /**
   * Get skill modifier for an actor
   */
  getSkillModifier(actor, skill) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = actor.system) == null ? void 0 : _a.skills) == null ? void 0 : _b[skill]) == null ? void 0 : _c.mod) || 0;
  }
  /**
   * Evaluate knowledge check result
   */
  evaluateKnowledgeResult(total, dc) {
    const margin = total - dc;
    if (margin >= 10) return "criticalSuccess";
    if (margin >= 0) return "success";
    if (margin >= -10) return "failure";
    return "criticalFailure";
  }
}
class HookManager {
  constructor() {
    __publicField(this, "registeredHooks", /* @__PURE__ */ new Map());
  }
  /**
   * Setup all module hooks
   */
  setupHooks() {
    console.log(`${MODULE_ID} | Setting up hooks`);
    this.registerHook("init", this.onInit.bind(this));
    this.registerHook("ready", this.onReady.bind(this));
    this.registerHook("canvasReady", this.onCanvasReady.bind(this));
    this.registerHook("createActor", this.onCreateActor.bind(this));
    this.registerHook("updateActor", this.onUpdateActor.bind(this));
    this.registerHook("deleteActor", this.onDeleteActor.bind(this));
    this.registerHook("createItem", this.onCreateItem.bind(this));
    this.registerHook("updateItem", this.onUpdateItem.bind(this));
    this.registerHook("deleteItem", this.onDeleteItem.bind(this));
    this.registerHook("createChatMessage", this.onCreateChatMessage.bind(this));
    this.registerHook("renderChatMessage", this.onRenderChatMessage.bind(this));
    this.registerHook("combatStart", this.onCombatStart.bind(this));
    this.registerHook("combatTurn", this.onCombatTurn.bind(this));
    this.registerHook("combatEnd", this.onCombatEnd.bind(this));
    this.registerHook("controlToken", this.onControlToken.bind(this));
    this.registerHook("updateToken", this.onUpdateToken.bind(this));
    this.registerHook("diceSoNice.diceRolled", this.onDiceRolled.bind(this));
  }
  /**
   * Register a hook
   */
  registerHook(event, callback, once = false) {
    if (!this.registeredHooks.has(event)) {
      this.registeredHooks.set(event, []);
    }
    this.registeredHooks.get(event).push(callback);
    if (once) {
      Hooks.once(event, callback);
    } else {
      Hooks.on(event, callback);
    }
  }
  /**
   * Unregister all hooks for this module
   */
  unregisterAllHooks() {
    for (const [event, callbacks] of this.registeredHooks) {
      callbacks.forEach((callback) => {
      });
    }
    this.registeredHooks.clear();
  }
  // =============================================================================
  // Hook Handlers
  // =============================================================================
  /**
   * Handle init hook
   */
  onInit() {
    console.log(`${MODULE_ID} | Init hook triggered`);
  }
  /**
   * Handle ready hook
   */
  onReady() {
    console.log(`${MODULE_ID} | Ready hook triggered`);
    this.setupUI();
    this.initializeReadyFeatures();
  }
  /**
   * Handle canvas ready hook
   */
  onCanvasReady(canvas) {
    console.log(`${MODULE_ID} | Canvas ready hook triggered`);
  }
  /**
   * Handle actor creation
   */
  onCreateActor(actor, options, userId) {
    console.log(`${MODULE_ID} | Actor created: ${actor.name}`);
    this.applyDefaultActorRules(actor);
  }
  /**
   * Handle actor updates
   */
  onUpdateActor(actor, updateData, options, userId) {
    console.log(`${MODULE_ID} | Actor updated: ${actor.name}`);
    this.processActorUpdate(actor, updateData);
  }
  /**
   * Handle actor deletion
   */
  onDeleteActor(actor, options, userId) {
    console.log(`${MODULE_ID} | Actor deleted: ${actor.name}`);
    this.cleanupActorData(actor);
  }
  /**
   * Handle item creation
   */
  onCreateItem(item, options, userId) {
    console.log(`${MODULE_ID} | Item created: ${item.name}`);
    this.processItemRules(item);
  }
  /**
   * Handle item updates
   */
  onUpdateItem(item, updateData, options, userId) {
    console.log(`${MODULE_ID} | Item updated: ${item.name}`);
    this.processItemRules(item);
  }
  /**
   * Handle item deletion
   */
  onDeleteItem(item, options, userId) {
    console.log(`${MODULE_ID} | Item deleted: ${item.name}`);
    this.cleanupItemRules(item);
  }
  /**
   * Handle chat message creation
   */
  onCreateChatMessage(message, options, userId) {
    if (this.isKnowledgeCheck(message)) {
      this.processKnowledgeCheck(message);
    }
  }
  /**
   * Handle chat message rendering
   */
  onRenderChatMessage(message, html, data) {
    this.enhanceChatMessage(message, html, data);
  }
  /**
   * Handle combat start
   */
  onCombatStart(combat) {
    console.log(`${MODULE_ID} | Combat started`);
    this.initializeCombatTracking(combat);
  }
  /**
   * Handle combat turn
   */
  onCombatTurn(combat, updateData, options) {
    console.log(`${MODULE_ID} | Combat turn changed`);
    this.processCombatTurn(combat);
  }
  /**
   * Handle combat end
   */
  onCombatEnd(combat) {
    console.log(`${MODULE_ID} | Combat ended`);
    this.cleanupCombatTracking(combat);
  }
  /**
   * Handle token control
   */
  onControlToken(token, controlled) {
    if (controlled) {
      console.log(`${MODULE_ID} | Token controlled: ${token.name}`);
      this.displayTokenKnowledge(token);
    }
  }
  /**
   * Handle token updates
   */
  onUpdateToken(token, updateData, options, userId) {
    this.processTokenUpdate(token, updateData);
  }
  /**
   * Handle dice rolls (if Dice So Nice is installed)
   */
  onDiceRolled(roll) {
    this.processDiceRoll(roll);
  }
  // =============================================================================
  // Helper Methods
  // =============================================================================
  /**
   * Setup UI elements
   */
  setupUI() {
  }
  /**
   * Initialize features that require the ready hook
   */
  initializeReadyFeatures() {
  }
  /**
   * Apply default rule elements to new actors
   */
  applyDefaultActorRules(actor) {
  }
  /**
   * Process actor updates for rule elements
   */
  processActorUpdate(actor, updateData) {
  }
  /**
   * Clean up actor-related data
   */
  cleanupActorData(actor) {
  }
  /**
   * Process item rule elements
   */
  processItemRules(item) {
  }
  /**
   * Clean up item rule elements
   */
  cleanupItemRules(item) {
  }
  /**
   * Check if a chat message is a knowledge check
   */
  isKnowledgeCheck(message) {
    return false;
  }
  /**
   * Process knowledge check results
   */
  processKnowledgeCheck(message) {
  }
  /**
   * Enhance chat messages with module features
   */
  enhanceChatMessage(message, html, data) {
  }
  /**
   * Initialize combat tracking
   */
  initializeCombatTracking(combat) {
  }
  /**
   * Process combat turn changes
   */
  processCombatTurn(combat) {
  }
  /**
   * Clean up combat tracking
   */
  cleanupCombatTracking(combat) {
  }
  /**
   * Display knowledge information for a token
   */
  displayTokenKnowledge(token) {
  }
  /**
   * Process token updates
   */
  processTokenUpdate(token, updateData) {
  }
  /**
   * Process dice rolls
   */
  processDiceRoll(roll) {
  }
}
class RecallKnowledgeManager {
  constructor() {
    __publicField(this, "pendingRequests", /* @__PURE__ */ new Map());
  }
  /**
   * Initiate a recall knowledge check from a player
   */
  async initiateRecallKnowledge(actor, target) {
    var _a;
    if (!actor || !target) {
      ui.notifications.error(game.i18n.localize("recall-knowledge.errors.noTarget"));
      return;
    }
    const settings = (_a = game.RecallKnowledge) == null ? void 0 : _a.settings;
    if ((settings == null ? void 0 : settings.requiresGMApproval()) && !game.user.isGM) {
      await this.requestGMApproval(actor, target);
    } else {
      await this.showSkillSelectionDialog(actor, target);
    }
  }
  /**
   * Request GM approval for recall knowledge
   */
  async requestGMApproval(actor, target) {
    var _a, _b;
    const requestId = foundry.utils.randomID();
    const availableSkills = this.getAvailableSkills(actor);
    const request = {
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
    const socketHandler = (_b = (_a = game.RecallKnowledge) == null ? void 0 : _a.module) == null ? void 0 : _b.socketHandler;
    if (socketHandler) {
      socketHandler.sendMessage("gmApprovalRequest", request, this.getGMUserIds());
    }
    ui.notifications.info(`Recall Knowledge request sent to GM for ${target.name}`);
  }
  /**
   * Show GM approval dialog
   */
  async showGMApprovalDialog(request) {
    if (!game.user.isGM) return;
    const target = game.actors.get(request.targetId);
    if (!target) return;
    const content = this.generateGMApprovalHTML(request, target);
    new Dialog({
      title: game.i18n.localize("recall-knowledge.ui.gmApproval.title"),
      content,
      buttons: {
        approve: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("recall-knowledge.ui.gmApproval.approve"),
          callback: (html) => this.approveRequest(request, html)
        },
        deny: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("recall-knowledge.ui.gmApproval.deny"),
          callback: () => this.denyRequest(request)
        }
      },
      default: "approve",
      close: () => this.denyRequest(request)
    }).render(true);
  }
  /**
   * Approve GM request and initiate roll
   */
  async approveRequest(request, html) {
    var _a, _b;
    const selectedSkillKey = html.find('[name="selectedSkill"]:checked').val();
    const customDC = parseInt(html.find('[name="customDC"]').val()) || null;
    const selectedSkill = request.availableSkills.find((s) => s.key === selectedSkillKey);
    if (!selectedSkill) return;
    const actor = game.actors.get(request.actorId);
    const target = game.actors.get(request.targetId);
    if (!actor || !target) return;
    const result = await this.performRecallKnowledgeRoll(actor, target, selectedSkill, customDC || void 0);
    const socketHandler = (_b = (_a = game.RecallKnowledge) == null ? void 0 : _a.module) == null ? void 0 : _b.socketHandler;
    if (socketHandler) {
      socketHandler.sendMessage("recallKnowledgeResult", {
        requestId: request.id,
        result
      }, [request.playerId]);
    }
    if (result.success) {
      await this.showInformationSelectionDialog(target, result, request.playerId);
    }
    this.pendingRequests.delete(request.id);
  }
  /**
   * Deny GM request
   */
  denyRequest(request) {
    var _a, _b;
    const socketHandler = (_b = (_a = game.RecallKnowledge) == null ? void 0 : _a.module) == null ? void 0 : _b.socketHandler;
    if (socketHandler) {
      socketHandler.sendMessage("recallKnowledgeDenied", {
        requestId: request.id,
        reason: "GM denied the request"
      }, [request.playerId]);
    }
    this.pendingRequests.delete(request.id);
  }
  /**
   * Show skill selection dialog (for direct rolls)
   */
  async showSkillSelectionDialog(actor, target) {
    const availableSkills = this.getAvailableSkills(actor);
    const content = this.generateSkillSelectionHTML(actor, target, availableSkills);
    new Dialog({
      title: game.i18n.localize("recall-knowledge.ui.knowledgeCheck.title"),
      content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: game.i18n.localize("recall-knowledge.ui.knowledgeCheck.roll"),
          callback: (html) => this.handleDirectRoll(actor, target, html)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("recall-knowledge.ui.knowledgeCheck.cancel"),
          callback: () => {
          }
        }
      },
      default: "roll"
    }).render(true);
  }
  /**
   * Handle direct roll without GM approval
   */
  async handleDirectRoll(actor, target, html) {
    const selectedSkillKey = html.find('[name="selectedSkill"]:checked').val();
    const availableSkills = this.getAvailableSkills(actor);
    const selectedSkill = availableSkills.find((s) => s.key === selectedSkillKey);
    if (!selectedSkill) return;
    const result = await this.performRecallKnowledgeRoll(actor, target, selectedSkill);
    if (result.success && game.user.isGM) {
      await this.showInformationSelectionDialog(target, result);
    }
  }
  /**
   * Perform the actual recall knowledge roll
   */
  async performRecallKnowledgeRoll(actor, target, skill, customDC) {
    const dc = customDC || this.calculateDefaultDC(target);
    const roll = new Roll(`1d20 + ${skill.modifier}`);
    await roll.evaluate();
    const total = roll.total || 0;
    const margin = total - dc;
    let degree;
    if (margin >= 10) degree = "criticalSuccess";
    else if (margin >= 0) degree = "success";
    else if (margin >= -10) degree = "failure";
    else degree = "criticalFailure";
    const success = degree === "success" || degree === "criticalSuccess";
    await this.createRollChatMessage(actor, target, skill, roll, dc, degree);
    const availableInfo = success ? this.getAvailableInformation(target, degree === "criticalSuccess") : [];
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
  async showInformationSelectionDialog(target, result, playerId) {
    const content = this.generateInformationSelectionHTML(target, result);
    new Dialog({
      title: game.i18n.localize("recall-knowledge.ui.informationReveal.title"),
      content,
      buttons: {
        revealSelected: {
          icon: '<i class="fas fa-eye"></i>',
          label: game.i18n.localize("recall-knowledge.ui.informationReveal.revealSelected"),
          callback: (html) => this.revealSelectedInformation(target, result, html, playerId)
        },
        revealAll: {
          icon: '<i class="fas fa-eye-slash"></i>',
          label: game.i18n.localize("recall-knowledge.ui.informationReveal.revealAll"),
          callback: () => this.revealAllInformation(target, result, playerId)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("recall-knowledge.ui.informationReveal.cancel"),
          callback: () => {
          }
        }
      },
      default: "revealSelected"
    }).render(true);
  }
  /**
   * Reveal selected information to player
   */
  async revealSelectedInformation(target, result, html, playerId) {
    const selectedInfo = [];
    html.find('[name="selectedInfo"]:checked').each((i, el) => {
      const index = parseInt($(el).val());
      if (result.availableInfo[index]) {
        selectedInfo.push(result.availableInfo[index]);
      }
    });
    await this.createInformationChatMessage(target, selectedInfo, playerId);
  }
  /**
   * Reveal all available information to player
   */
  async revealAllInformation(target, result, playerId) {
    await this.createInformationChatMessage(target, result.availableInfo, playerId);
  }
  /**
   * Get available skills for an actor
   */
  getAvailableSkills(actor) {
    var _a, _b, _c;
    const skills = [];
    const settings = (_a = game.RecallKnowledge) == null ? void 0 : _a.settings;
    const knowledgeSkills = ["arcana", "nature", "occultism", "religion", "crafting"];
    for (const skillKey of knowledgeSkills) {
      const skill = (_c = (_b = actor.system) == null ? void 0 : _b.skills) == null ? void 0 : _c[skillKey];
      if (skill) {
        skills.push({
          key: skillKey,
          name: game.i18n.localize(`recall-knowledge.ui.knowledgeCheck.${skillKey}`),
          modifier: skill.mod || 0,
          isLore: false
        });
      }
    }
    if (settings == null ? void 0 : settings.shouldIncludeLoreSkills()) {
      const loreSkills = this.getLoreSkills(actor);
      skills.push(...loreSkills);
    }
    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }
  /**
   * Get lore skills for an actor
   */
  getLoreSkills(actor) {
    var _a;
    const loreSkills = [];
    if ((_a = actor.system) == null ? void 0 : _a.skills) {
      for (const [key, skill] of Object.entries(actor.system.skills)) {
        if (key.includes("lore") && skill.mod !== void 0) {
          loreSkills.push({
            key,
            name: skill.name || key,
            modifier: skill.mod || 0,
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
  calculateDefaultDC(target) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const settings = (_a = game.RecallKnowledge) == null ? void 0 : _a.settings;
    if (!(settings == null ? void 0 : settings.shouldAutoCalculateDC())) {
      return 15;
    }
    const method = settings.getDCCalculationMethod();
    let level = 0;
    switch (method) {
      case "level":
        level = ((_c = (_b = target.system) == null ? void 0 : _b.level) == null ? void 0 : _c.value) || ((_f = (_e = (_d = target.system) == null ? void 0 : _d.details) == null ? void 0 : _e.level) == null ? void 0 : _f.value) || 0;
        break;
      case "cr":
        level = ((_h = (_g = target.system) == null ? void 0 : _g.details) == null ? void 0 : _h.cr) || ((_i = target.system) == null ? void 0 : _i.cr) || 0;
        break;
      default:
        level = 0;
    }
    return Math.max(10, 10 + level);
  }
  /**
   * Get available information about a creature
   */
  getAvailableInformation(target, criticalSuccess) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    const settings = (_a = game.RecallKnowledge) == null ? void 0 : _a.settings;
    const revealableInfo = (settings == null ? void 0 : settings.getRevealableInfo()) || {};
    const information = [];
    if ((_b = revealableInfo.basicInfo) == null ? void 0 : _b.visible) {
      information.push({
        category: "basic",
        label: "Name and Type",
        value: `${target.name} (${((_e = (_d = (_c = target.system) == null ? void 0 : _c.traits) == null ? void 0 : _d.value) == null ? void 0 : _e.join(", ")) || "Unknown type"})`,
        requiresSuccess: false,
        requiresCriticalSuccess: false,
        gmOnly: revealableInfo.basicInfo.gmOnly,
        revealed: false
      });
    }
    if ((_f = revealableInfo.ac) == null ? void 0 : _f.visible) {
      const ac = ((_i = (_h = (_g = target.system) == null ? void 0 : _g.attributes) == null ? void 0 : _h.ac) == null ? void 0 : _i.value) || ((_k = (_j = target.system) == null ? void 0 : _j.ac) == null ? void 0 : _k.value) || "Unknown";
      information.push({
        category: "defense",
        label: "Armor Class",
        value: `AC ${ac}`,
        requiresSuccess: true,
        requiresCriticalSuccess: false,
        gmOnly: revealableInfo.ac.gmOnly,
        revealed: false
      });
    }
    if ((_l = revealableInfo.resistances) == null ? void 0 : _l.visible) {
      const resistances = this.getResistancesText(target);
      if (resistances) {
        information.push({
          category: "defense",
          label: "Resistances/Immunities",
          value: resistances,
          requiresSuccess: true,
          requiresCriticalSuccess: false,
          gmOnly: revealableInfo.resistances.gmOnly,
          revealed: false
        });
      }
    }
    if ((_m = revealableInfo.weaknesses) == null ? void 0 : _m.visible) {
      const weaknesses = this.getWeaknessesText(target);
      if (weaknesses) {
        information.push({
          category: "defense",
          label: "Weaknesses",
          value: weaknesses,
          requiresSuccess: true,
          requiresCriticalSuccess: false,
          gmOnly: revealableInfo.weaknesses.gmOnly,
          revealed: false
        });
      }
    }
    if (((_n = revealableInfo.saves) == null ? void 0 : _n.visible) && criticalSuccess) {
      const saves = this.getSavesText(target);
      if (saves) {
        information.push({
          category: "defense",
          label: "Saving Throws",
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
  getResistancesText(target) {
    var _a, _b, _c, _d, _e, _f;
    const resistances = ((_b = (_a = target.system) == null ? void 0 : _a.traits) == null ? void 0 : _b.dr) || ((_c = target.system) == null ? void 0 : _c.resistances) || [];
    const immunities = ((_e = (_d = target.system) == null ? void 0 : _d.traits) == null ? void 0 : _e.di) || ((_f = target.system) == null ? void 0 : _f.immunities) || [];
    const parts = [];
    if (resistances.length > 0) parts.push(`Resistance: ${resistances.join(", ")}`);
    if (immunities.length > 0) parts.push(`Immunity: ${immunities.join(", ")}`);
    return parts.join("; ");
  }
  /**
   * Get weaknesses text for a creature
   */
  getWeaknessesText(target) {
    var _a, _b, _c;
    const weaknesses = ((_b = (_a = target.system) == null ? void 0 : _a.traits) == null ? void 0 : _b.dv) || ((_c = target.system) == null ? void 0 : _c.weaknesses) || [];
    return weaknesses.length > 0 ? `Weakness: ${weaknesses.join(", ")}` : "";
  }
  /**
   * Get saving throws text for a creature
   */
  getSavesText(target) {
    var _a;
    const saves = ((_a = target.system) == null ? void 0 : _a.saves) || {};
    const saveTexts = [];
    for (const [save, data] of Object.entries(saves)) {
      if (data.value !== void 0) {
        saveTexts.push(`${save.toUpperCase()}: +${data.value}`);
      }
    }
    return saveTexts.join(", ");
  }
  /**
   * Create chat message for the roll result
   */
  async createRollChatMessage(actor, target, skill, roll, dc, degree) {
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
  async createInformationChatMessage(target, information, playerId) {
    if (information.length === 0) return;
    const content = `
      <div class="recall-knowledge-information">
        <h3>Knowledge about ${target.name}</h3>
        <ul>
          ${information.map((info) => `<li><strong>${info.label}:</strong> ${info.value}</li>`).join("")}
        </ul>
      </div>
    `;
    const messageData = {
      user: game.user.id,
      content,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    };
    if (playerId) {
      messageData.whisper = [playerId];
    }
    await ChatMessage.create(messageData);
  }
  /**
   * Get GM user IDs
   */
  getGMUserIds() {
    return game.users.filter((user) => user.isGM).map((user) => user.id);
  }
  /**
   * Generate HTML for GM approval dialog
   */
  generateGMApprovalHTML(request, target) {
    const skillsHTML = request.availableSkills.map(
      (skill, index) => `<div>
        <input type="radio" name="selectedSkill" value="${skill.key}" id="skill-${index}" ${index === 0 ? "checked" : ""}>
        <label for="skill-${index}">${skill.name} (+${skill.modifier})</label>
      </div>`
    ).join("");
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
  generateSkillSelectionHTML(actor, target, skills) {
    const skillsHTML = skills.map(
      (skill, index) => `<div>
        <input type="radio" name="selectedSkill" value="${skill.key}" id="skill-${index}" ${index === 0 ? "checked" : ""}>
        <label for="skill-${index}">${skill.name} (+${skill.modifier})</label>
      </div>`
    ).join("");
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
  generateInformationSelectionHTML(target, result) {
    const infoHTML = result.availableInfo.map(
      (info, index) => `<div>
        <input type="checkbox" name="selectedInfo" value="${index}" id="info-${index}" checked>
        <label for="info-${index}">
          <strong>${info.label}:</strong> ${info.value}
          ${info.gmOnly ? " <em>(GM Only)</em>" : ""}
        </label>
      </div>`
    ).join("");
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
class RulesEngine {
  constructor() {
    __publicField(this, "ruleElements", /* @__PURE__ */ new Map());
    __publicField(this, "processors", /* @__PURE__ */ new Map());
  }
  /**
   * Initialize the rules engine
   */
  async initialize() {
    console.log(`${MODULE_ID} | Initializing Rules Engine`);
    this.registerProcessor("knowledge", this.processKnowledgeRule.bind(this));
    this.registerProcessor("modifier", this.processModifierRule.bind(this));
    this.setupRuleHooks();
  }
  /**
   * Register a rule processor
   */
  registerProcessor(type, processor) {
    this.processors.set(type, processor);
    console.log(`${MODULE_ID} | Registered processor for rule type: ${type}`);
  }
  /**
   * Add a rule element
   */
  addRuleElement(element) {
    this.ruleElements.set(element.key, element);
    this.processRuleElement(element);
  }
  /**
   * Remove a rule element
   */
  removeRuleElement(key) {
    return this.ruleElements.delete(key);
  }
  /**
   * Get a rule element by key
   */
  getRuleElement(key) {
    return this.ruleElements.get(key);
  }
  /**
   * Get all rule elements
   */
  getAllRuleElements() {
    return Array.from(this.ruleElements.values());
  }
  /**
   * Process a rule element based on its type
   */
  processRuleElement(element) {
    const processor = this.processors.get(element.key.split(".")[0]);
    if (processor) {
      processor(element);
    }
  }
  /**
   * Process knowledge rule elements
   */
  processKnowledgeRule(element) {
    const knowledgeRule = element;
    console.log(`${MODULE_ID} | Processing knowledge rule: ${knowledgeRule.label}`);
  }
  /**
   * Process modifier rule elements
   */
  processModifierRule(element) {
    const modifierRule = element;
    console.log(`${MODULE_ID} | Processing modifier rule: ${modifierRule.label}`);
  }
  /**
   * Setup hooks for rule processing
   */
  setupRuleHooks() {
    Hooks.on("preUpdateActor", (actor, updateData) => {
      this.processActorRules(actor, updateData);
    });
    Hooks.on("preUpdateItem", (item, updateData) => {
      this.processItemRules(item, updateData);
    });
  }
  /**
   * Process rules for actor updates
   */
  processActorRules(actor, updateData) {
    const actorRules = this.getRulesForActor(actor);
    actorRules.forEach((rule) => this.processRuleElement(rule));
  }
  /**
   * Process rules for item updates
   */
  processItemRules(item, updateData) {
    const itemRules = this.getRulesForItem(item);
    itemRules.forEach((rule) => this.processRuleElement(rule));
  }
  /**
   * Get rule elements that apply to a specific actor
   */
  getRulesForActor(actor) {
    return this.getAllRuleElements().filter((rule) => {
      return this.evaluatePredicate(rule.predicate, actor);
    });
  }
  /**
   * Get rule elements that apply to a specific item
   */
  getRulesForItem(item) {
    return this.getAllRuleElements().filter((rule) => {
      return this.evaluatePredicate(rule.predicate, item);
    });
  }
  /**
   * Evaluate a predicate against a given context
   */
  evaluatePredicate(predicate, context) {
    if (!predicate || predicate.length === 0) {
      return true;
    }
    return predicate.every((condition) => {
      return true;
    });
  }
  /**
   * Create a sample knowledge rule element
   */
  createSampleKnowledgeRule() {
    return {
      key: "knowledge.sample",
      label: "Sample Knowledge Check",
      selector: "check",
      dc: 15,
      type: "arcana",
      priority: 10,
      success: "You recall basic information about this creature.",
      criticalSuccess: "You recall detailed information about this creature's abilities and weaknesses.",
      failure: "You cannot recall anything useful about this creature.",
      criticalFailure: "You recall false information about this creature."
    };
  }
  /**
   * Create a sample modifier rule element
   */
  createSampleModifierRule() {
    return {
      key: "modifier.sample",
      label: "Sample Knowledge Bonus",
      selector: "skill-check",
      type: "circumstance",
      value: 2,
      priority: 20,
      predicate: ["action:recall-knowledge"]
    };
  }
}
class RecallKnowledgeSettings {
  /**
   * Register all module settings
   */
  async register() {
    console.log(`${MODULE_ID} | Registering module settings`);
    game.settings.register(MODULE_ID, "enableRulesEngine", {
      name: "recall-knowledge.settings.enableRulesEngine.name",
      hint: "recall-knowledge.settings.enableRulesEngine.hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      requiresReload: true
    });
    game.settings.register(MODULE_ID, "debugMode", {
      name: "recall-knowledge.settings.debugMode.name",
      hint: "recall-knowledge.settings.debugMode.hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    });
    game.settings.register(MODULE_ID, "autoRollKnowledge", {
      name: "recall-knowledge.settings.autoRollKnowledge.name",
      hint: "recall-knowledge.settings.autoRollKnowledge.hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    });
    game.settings.register(MODULE_ID, "maxKnowledgeAttempts", {
      name: "recall-knowledge.settings.maxKnowledgeAttempts.name",
      hint: "recall-knowledge.settings.maxKnowledgeAttempts.hint",
      scope: "world",
      config: true,
      type: Number,
      default: 1,
      range: {
        min: 1,
        max: 10,
        step: 1
      }
    });
    game.settings.register(MODULE_ID, "chatOutputStyle", {
      name: "recall-knowledge.settings.chatOutputStyle.name",
      hint: "recall-knowledge.settings.chatOutputStyle.hint",
      scope: "world",
      config: true,
      type: String,
      default: "detailed",
      choices: {
        "simple": "recall-knowledge.settings.chatOutputStyle.simple",
        "detailed": "recall-knowledge.settings.chatOutputStyle.detailed",
        "whisper": "recall-knowledge.settings.chatOutputStyle.whisper"
      }
    });
    game.settings.register(MODULE_ID, "requireGMApproval", {
      name: "recall-knowledge.settings.requireGMApproval.name",
      hint: "recall-knowledge.settings.requireGMApproval.hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });
    game.settings.register(MODULE_ID, "revealableInfo", {
      name: "recall-knowledge.settings.revealableInfo.name",
      hint: "recall-knowledge.settings.revealableInfo.hint",
      scope: "world",
      config: true,
      type: Object,
      default: {
        basicInfo: { visible: true, gmOnly: false },
        // Name, type, size
        abilities: { visible: true, gmOnly: false },
        // Abilities and scores
        skills: { visible: true, gmOnly: true },
        // Skill bonuses
        saves: { visible: true, gmOnly: false },
        // Saving throws
        ac: { visible: true, gmOnly: false },
        // Armor class
        hp: { visible: false, gmOnly: true },
        // Hit points
        resistances: { visible: true, gmOnly: false },
        // Resistances/immunities
        weaknesses: { visible: true, gmOnly: false },
        // Weaknesses
        attacks: { visible: true, gmOnly: true },
        // Attack bonuses
        spells: { visible: true, gmOnly: true },
        // Spell information
        traits: { visible: true, gmOnly: false },
        // Creature traits
        lore: { visible: true, gmOnly: false }
        // Lore and background
      }
    });
    game.settings.register(MODULE_ID, "autoCalculateDC", {
      name: "recall-knowledge.settings.autoCalculateDC.name",
      hint: "recall-knowledge.settings.autoCalculateDC.hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });
    game.settings.register(MODULE_ID, "dcCalculationMethod", {
      name: "recall-knowledge.settings.dcCalculationMethod.name",
      hint: "recall-knowledge.settings.dcCalculationMethod.hint",
      scope: "world",
      config: true,
      type: String,
      default: "level",
      choices: {
        "level": "recall-knowledge.settings.dcCalculationMethod.level",
        "cr": "recall-knowledge.settings.dcCalculationMethod.cr",
        "custom": "recall-knowledge.settings.dcCalculationMethod.custom"
      }
    });
    game.settings.register(MODULE_ID, "includeLoreSkills", {
      name: "recall-knowledge.settings.includeLoreSkills.name",
      hint: "recall-knowledge.settings.includeLoreSkills.hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });
  }
  /**
  * Get a setting value
  */
  getSetting(key) {
    return game.settings.get(MODULE_ID, key);
  }
  /**
   * Set a setting value
   */
  async setSetting(key, value) {
    return game.settings.set(MODULE_ID, key, value);
  }
  /**
   * Check if rules engine is enabled
   */
  isRulesEngineEnabled() {
    return this.getSetting("enableRulesEngine");
  }
  /**
   * Check if debug mode is enabled
   */
  isDebugMode() {
    return this.getSetting("debugMode");
  }
  /**
   * Check if GM approval is required for recall knowledge checks
   */
  requiresGMApproval() {
    return this.getSetting("requireGMApproval");
  }
  /**
   * Get revealable information settings
   */
  getRevealableInfo() {
    return this.getSetting("revealableInfo");
  }
  /**
   * Check if DC should be auto-calculated
   */
  shouldAutoCalculateDC() {
    return this.getSetting("autoCalculateDC");
  }
  /**
   * Get DC calculation method
   */
  getDCCalculationMethod() {
    return this.getSetting("dcCalculationMethod");
  }
  /**
   * Check if lore skills should be included
   */
  shouldIncludeLoreSkills() {
    return this.getSetting("includeLoreSkills");
  }
}
class SocketHandler {
  constructor() {
    __publicField(this, "socketName");
    __publicField(this, "messageHandlers", /* @__PURE__ */ new Map());
    this.socketName = `module.${MODULE_ID}`;
  }
  /**
   * Initialize socket handling
   */
  initialize() {
    console.log(`${MODULE_ID} | Initializing socket handler`);
    game.socket.on(this.socketName, (message) => {
      this.handleSocketMessage(message);
    });
    this.registerHandlers();
  }
  /**
   * Register message handlers
   */
  registerHandlers() {
    this.messageHandlers.set("knowledgeCheck", this.handleKnowledgeCheck.bind(this));
    this.messageHandlers.set("shareKnowledge", this.handleShareKnowledge.bind(this));
    this.messageHandlers.set("updateRules", this.handleUpdateRules.bind(this));
    this.messageHandlers.set("syncData", this.handleSyncData.bind(this));
    this.messageHandlers.set("gmApprovalRequest", this.handleGMApprovalRequest.bind(this));
    this.messageHandlers.set("recallKnowledgeResult", this.handleRecallKnowledgeResult.bind(this));
    this.messageHandlers.set("recallKnowledgeDenied", this.handleRecallKnowledgeDenied.bind(this));
  }
  /**
   * Send a socket message
   */
  sendMessage(type, data, targets) {
    const message = {
      type,
      data,
      sender: game.user.id,
      timestamp: Date.now()
    };
    if (targets && targets.length > 0) {
      targets.forEach((userId) => {
        game.socket.emit(this.socketName, message, userId);
      });
    } else {
      game.socket.emit(this.socketName, message);
    }
    console.log(`${MODULE_ID} | Sent socket message: ${type}`, data);
  }
  /**
   * Handle incoming socket messages
   */
  handleSocketMessage(message) {
    console.log(`${MODULE_ID} | Received socket message: ${message.type}`, message);
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
  handleKnowledgeCheck(message) {
    const { actorId, checkType, result } = message.data;
    console.log(`${MODULE_ID} | Processing knowledge check from ${message.sender}`);
    this.processRemoteKnowledgeCheck(actorId, checkType, result);
  }
  /**
   * Handle share knowledge messages
   */
  handleShareKnowledge(message) {
    const { knowledge, targetActorId } = message.data;
    console.log(`${MODULE_ID} | Received shared knowledge from ${message.sender}`);
    this.displaySharedKnowledge(knowledge, targetActorId);
  }
  /**
   * Handle rule update messages
   */
  handleUpdateRules(message) {
    const { ruleElement, action } = message.data;
    console.log(`${MODULE_ID} | Received rule update from ${message.sender}`);
    this.updateLocalRules(ruleElement, action);
  }
  /**
   * Handle sync data messages
   */
  handleSyncData(message) {
    const { dataType, syncData } = message.data;
    console.log(`${MODULE_ID} | Received sync data from ${message.sender}`);
    this.synchronizeData(dataType, syncData);
  }
  // =============================================================================
  // Utility Methods
  // =============================================================================
  /**
   * Send a knowledge check result to other players
   */
  shareKnowledgeCheck(actorId, checkType, result) {
    this.sendMessage("knowledgeCheck", {
      actorId,
      checkType,
      result
    });
  }
  /**
   * Share knowledge information with specific players
   */
  shareKnowledge(knowledge, targetActorId, targets) {
    this.sendMessage("shareKnowledge", {
      knowledge,
      targetActorId
    }, targets);
  }
  /**
   * Broadcast rule element updates
   */
  updateRules(ruleElement, action) {
    if (!game.user.isGM) {
      return;
    }
    this.sendMessage("updateRules", {
      ruleElement,
      action
    });
  }
  /**
   * Request data synchronization
   */
  requestSync(dataType) {
    this.sendMessage("syncData", {
      dataType,
      request: true
    });
  }
  /**
   * Send synchronization data
   */
  sendSyncData(dataType, syncData, targets) {
    this.sendMessage("syncData", {
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
  processRemoteKnowledgeCheck(actorId, checkType, result) {
    const actor = game.actors.get(actorId);
    if (!actor) {
      console.warn(`${MODULE_ID} | Actor not found for knowledge check: ${actorId}`);
      return;
    }
    ui.notifications.info(`Knowledge check performed on ${actor.name} by another player`);
  }
  /**
   * Display shared knowledge to the user
   */
  displaySharedKnowledge(knowledge, targetActorId) {
    const actor = game.actors.get(targetActorId);
    if (!actor) {
      return;
    }
  }
  /**
   * Update local rules based on remote changes
   */
  updateLocalRules(ruleElement, action) {
  }
  /**
   * Synchronize data with remote clients
   */
  synchronizeData(dataType, syncData) {
  }
  /**
   * Check if user has permission for socket operations
   */
  hasPermission(operation) {
    switch (operation) {
      case "shareKnowledge":
        return true;
      case "updateRules":
        return game.user.isGM;
      default:
        return false;
    }
  }
  /**
   * Handle GM approval request messages
   */
  handleGMApprovalRequest(message) {
    var _a, _b;
    if (!game.user.isGM) return;
    const recallKnowledgeManager = (_b = (_a = globalThis.RecallKnowledge) == null ? void 0 : _a.module) == null ? void 0 : _b.recallKnowledgeManager;
    if (recallKnowledgeManager) {
      recallKnowledgeManager.showGMApprovalDialog(message.data);
    }
  }
  /**
   * Handle recall knowledge result messages
   */
  handleRecallKnowledgeResult(message) {
    const { result } = message.data;
    if (result.success) {
      ui.notifications.info(`Recall Knowledge ${result.degree}: You learned something!`);
    } else {
      ui.notifications.warn(`Recall Knowledge ${result.degree}: You couldn't recall anything useful.`);
    }
  }
  /**
   * Handle recall knowledge denied messages
   */
  handleRecallKnowledgeDenied(message) {
    const { reason } = message.data;
    ui.notifications.warn(`Recall Knowledge request denied: ${reason || "GM denied the request"}`);
  }
}
const _RecallKnowledgeModule = class _RecallKnowledgeModule {
  constructor() {
    __publicField(this, "settings");
    __publicField(this, "rulesEngine");
    __publicField(this, "hookManager");
    __publicField(this, "socketHandler");
    __publicField(this, "api");
    __publicField(this, "recallKnowledgeManager");
    if (_RecallKnowledgeModule.instance) {
      return _RecallKnowledgeModule.instance;
    }
    _RecallKnowledgeModule.instance = this;
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
  async initialize() {
    console.log(`${MODULE_TITLE} | Initializing module...`);
    try {
      await this.settings.register();
      await this.rulesEngine.initialize();
      this.hookManager.setupHooks();
      this.socketHandler.initialize();
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
  static getInstance() {
    if (!_RecallKnowledgeModule.instance) {
      _RecallKnowledgeModule.instance = new _RecallKnowledgeModule();
    }
    return _RecallKnowledgeModule.instance;
  }
  /**
   * Get the recall knowledge manager
   */
  getRecallKnowledgeManager() {
    return this.recallKnowledgeManager;
  }
};
__publicField(_RecallKnowledgeModule, "instance");
let RecallKnowledgeModule = _RecallKnowledgeModule;
Hooks.once("init", async () => {
  const module = RecallKnowledgeModule.getInstance();
  await module.initialize();
});
Hooks.once("ready", () => {
  console.log(`${MODULE_TITLE} | Module ready`);
  const moduleInstance = RecallKnowledgeModule.getInstance();
  globalThis.game.RecallKnowledge = {
    module: moduleInstance,
    recallKnowledgeManager: moduleInstance.getRecallKnowledgeManager(),
    MODULE_ID,
    MODULE_TITLE
  };
});
//# sourceMappingURL=recall-knowledge.js.map
