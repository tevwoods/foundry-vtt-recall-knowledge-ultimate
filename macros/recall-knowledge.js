/**
 * Recall Knowledge Macro
 * This macro should be created in FoundryVTT for players to use
 */

// Get the controlled token
const controlled = canvas.tokens.controlled;
if (controlled.length === 0) {
    ui.notifications.warn("Please select your character token first.");
    return;
}

// Get the targeted token
const targeted = game.user.targets;
if (targeted.size === 0) {
    ui.notifications.warn("Please target a creature to recall knowledge about.");
    return;
}

const actor = controlled[0].actor;
const target = Array.from(targeted)[0].actor;

if (!actor || !target) {
    ui.notifications.error("Unable to find valid actor and target.");
    return;
}

// Check if the Recall Knowledge module is loaded
if (!game.RecallKnowledge?.module?.recallKnowledgeManager) {
    ui.notifications.error("Recall Knowledge module not found or not loaded.");
    console.error("Recall Knowledge module check failed. Available:", {
        "game.RecallKnowledge": !!game.RecallKnowledge,
        "game.RecallKnowledge.module": !!game.RecallKnowledge?.module,
        \"game.RecallKnowledge.module.recallKnowledgeManager\": !!game.RecallKnowledge?.module?.recallKnowledgeManager
    });
    return;
}

// Initiate recall knowledge check
game.RecallKnowledge.module.recallKnowledgeManager.initiateRecallKnowledge(actor, Array.from(targeted)[0]);