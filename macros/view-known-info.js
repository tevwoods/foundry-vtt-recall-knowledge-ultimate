/**
 * View Known Information Macro
 * This macro displays all information the character has learned about the targeted creature
 */

// Get the targeted token
const targeted = game.user.targets;
if (targeted.size === 0) {
    ui.notifications.warn("Please target a creature to view known information.");
    return;
}

// Check if the Recall Knowledge module is loaded
if (!game.RecallKnowledge?.showLearnedInformation) {
    ui.notifications.error("Recall Knowledge module not found or not loaded.");
    return;
}

// Show learned information
game.RecallKnowledge.showLearnedInformation();
