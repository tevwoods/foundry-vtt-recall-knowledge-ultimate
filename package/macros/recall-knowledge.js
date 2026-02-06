/**
 * Recall Knowledge Macro
 * This macro should be created in FoundryVTT for players to use
 */

// Get the targeted token
const targeted = game.user.targets;
if (targeted.size === 0) {
    ui.notifications.warn("Please target a creature to recall knowledge about.");
    return;
}

// Get the controlled token or assigned character
let actor = null;
const controlled = canvas.tokens.controlled;
if (controlled.length > 0) {
    actor = controlled[0].actor;
} else {
    actor = game.user.character;
}

if (!actor) {
    ui.notifications.error("Please select your character token or ensure you have an assigned character.");
    return;
}

const target = Array.from(targeted)[0];

// Check if the Recall Knowledge module is loaded
if (!game.RecallKnowledge?.module?.recallKnowledgeManager) {
    ui.notifications.error("Recall Knowledge module not found or not loaded.");
    console.error("Recall Knowledge module check failed. Available:", {
        "game.RecallKnowledge": !!game.RecallKnowledge,
        "game.RecallKnowledge.module": !!game.RecallKnowledge?.module,
        "game.RecallKnowledge.module.recallKnowledgeManager": !!game.RecallKnowledge?.module?.recallKnowledgeManager
    });
    return;
}

// Initiate recall knowledge check
game.RecallKnowledge.module.recallKnowledgeManager.initiateRecallKnowledge(actor, Array.from(targeted)[0]);