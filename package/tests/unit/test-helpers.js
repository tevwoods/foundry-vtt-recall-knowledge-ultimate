/**
 * Mock FoundryVTT API for unit testing
 */

// Simple mock function creator
const createMockFn = (returnValue) => {
    const fn = (...args) => {
        fn.calls.push(args);
        return typeof returnValue === 'function' ? returnValue(...args) : returnValue;
    };
    fn.calls = [];
    fn.mockClear = () => { fn.calls = []; };
    return fn;
};

// Mock game object
export const mockGame = {
    user: {
        id: 'test-user-id',
        isGM: false,
        getFlag: createMockFn(null),
        setFlag: createMockFn(Promise.resolve()),
    },
    users: {
        filter: createMockFn([]),
    },
    actors: {
        contents: [],
        get: createMockFn(null),
        find: createMockFn(null),
    },
    settings: {
        get: createMockFn((module, key) => {
            const defaults = {
                'gmApproval': true,
                'autoCalculateDC': true,
                'hideRollFromPlayer': false,
                'falseInfoOnCritFail': false,
                'shareWithParty': false,
                'bestiaryScholarSkill': '',
            };
            return defaults[key] ?? null;
        }),
        set: createMockFn(Promise.resolve()),
        register: createMockFn(),
    },
};

// Mock actor
export function createMockActor(options = {}) {
    return {
        id: options.id || 'test-actor-id',
        name: options.name || 'Test Actor',
        type: options.type || 'character',
        items: options.items || [],
        system: {
            skills: options.skills || {
                arcana: { label: 'Arcana', rank: 2, modifier: 5 },
                nature: { label: 'Nature', rank: 3, modifier: 8 },
                occultism: { label: 'Occultism', rank: 1, modifier: 3 },
                religion: { label: 'Religion', rank: 2, modifier: 6 },
                society: { label: 'Society', rank: 4, modifier: 10 },
            },
            details: options.details || {
                level: { value: 5 },
            },
            saves: options.saves || {
                fortitude: { value: 12 },
                reflex: { value: 10 },
                will: { value: 8 },
            },
            traits: options.traits || {
                value: [],
            },
            attributes: options.attributes || {
                immunities: [],
                weaknesses: [],
                resistances: [],
            },
        },
    };
}

// Mock target actor
export function createMockTarget(options = {}) {
    return {
        id: options.id || 'test-target-id',
        name: options.name || 'Test Creature',
        actor: options.actor || null,
        system: {
            details: options.details || {
                level: { value: 3 },
            },
            traits: options.traits || {
                value: ['dragon'],
            },
            saves: options.saves || {
                fortitude: { value: 14 },
                reflex: { value: 12 },
                will: { value: 10 },
            },
            attributes: options.attributes || {
                immunities: [],
                weaknesses: [],
                resistances: [],
            },
        },
    };
}

// Mock feat item
export function createMockFeat(name, slug = null) {
    return {
        type: 'feat',
        name: name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        system: {
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        },
    };
}

// Mock UI notifications
export const mockUI = {
    notifications: {
        info: createMockFn(),
        warn: createMockFn(),
        error: createMockFn(),
    },
};

// Mock ChatMessage
export const mockChatMessage = {
    create: createMockFn(Promise.resolve()),
    getSpeaker: createMockFn({ alias: 'Test Actor' }),
};

// Mock Dialog
export class MockDialog {
    constructor(config) {
        this.config = config;
    }

    render() {
        return this;
    }
}

// Mock Roll
export class MockRoll {
    constructor(formula) {
        this.formula = formula;
        this._total = null;
    }

    async evaluate() {
        // Simple evaluation - just return a fixed value for testing
        this._total = 15;
        return this;
    }

    get total() {
        return this._total;
    }

    async render() {
        return `<div class="dice-roll">${this.formula} = ${this._total}</div>`;
    }
}

// Reset all mocks
export function resetMocks() {
    // Clear all mock function calls
    mockGame.user.getFlag.mockClear();
    mockGame.user.setFlag.mockClear();
    mockGame.users.filter.mockClear();
    mockGame.actors.get.mockClear();
    mockGame.actors.find.mockClear();
    mockGame.settings.get.mockClear();
    mockGame.settings.set.mockClear();
    mockGame.settings.register.mockClear();
    mockUI.notifications.info.mockClear();
    mockUI.notifications.warn.mockClear();
    mockUI.notifications.error.mockClear();
    mockChatMessage.create.mockClear();
    mockChatMessage.getSpeaker.mockClear();

    // Reset return values
    mockGame.user.getFlag = createMockFn(null);
    mockGame.settings.get = createMockFn((module, key) => {
        const defaults = {
            'gmApproval': true,
            'autoCalculateDC': true,
            'hideRollFromPlayer': false,
            'falseInfoOnCritFail': false,
            'shareWithParty': false,
            'bestiaryScholarSkill': '',
        };
        return defaults[key] ?? null;
    });
}

// Global setup
global.game = mockGame;
global.ui = mockUI;
global.ChatMessage = mockChatMessage;
global.Dialog = MockDialog;
global.Roll = MockRoll;
global.CONST = {
    CHAT_MESSAGE_TYPES: {
        ROLL: 5,
    },
};
global.CONFIG = {
    sounds: {
        dice: 'sounds/dice.wav',
    },
};
