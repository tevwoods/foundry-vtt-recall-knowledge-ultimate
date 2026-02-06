/**
 * Global type declarations for FoundryVTT
 * These types extend or provide fallbacks for Foundry VTT globals
 */

// Declare global Foundry VTT objects
declare global {
    const game: Game;
    const canvas: Canvas;
    const ui: UI;
    const foundry: any;
    const Hooks: HooksNamespace;
    const CONFIG: any;
    const CONST: any;

    class Roll {
        constructor(formula: string, data?: any);
        total?: number;
        evaluate(options?: any): Promise<Roll>;
    }

    type JQuery = any; // Simple jQuery type for compatibility
}

// Basic type interfaces for core Foundry functionality
interface Game {
    settings: GameSettings;
    socket: any;
    user: User;
    users: Collection<User>;
    actors: Collection<Actor>;
    items: Collection<Item>;
    scenes: Collection<Scene>;
    modules: Collection<any>;
    ready: boolean;
    i18n: {
        localize(key: string): string;
    };
}

// Additional Foundry globals
declare global {
    class Dialog {
        constructor(data: any, options?: any);
        render(force?: boolean): void;
    }

    class ChatMessage {
        static create(data: any): Promise<ChatMessage>;
        static getSpeaker(options?: any): any;
    }

    function renderTemplate(path: string, data?: any): Promise<string>;

    const CONFIG: any;
    const CONST: any;
    const $: any; // jQuery
} interface GameSettings {
    register(namespace: string, key: string, data: any): void;
    get(namespace: string, key: string): any;
    set(namespace: string, key: string, value: any): Promise<any>;
}

interface HooksNamespace {
    on(event: string, callback: Function): void;
    once(event: string, callback: Function): void;
    call(event: string, ...args: any[]): void;
    callAll(event: string, ...args: any[]): void;
}

interface Collection<T> {
    get(id: string): T | undefined;
    set(id: string, entity: T): void;
    delete(id: string): boolean;
    find(predicate: (entity: T) => boolean): T | undefined;
    filter(predicate: (entity: T) => boolean): T[];
    map<U>(callback: (entity: T) => U): U[];
    forEach(callback: (entity: T) => void): void;
    size: number;
}

interface User {
    id: string;
    name: string;
    isGM: boolean;
}

interface Actor {
    id: string;
    name: string;
    type: string;
    system: any;
}

interface Item {
    id: string;
    name: string;
    type: string;
    system: any;
}

interface Scene {
    id: string;
    name: string;
}

interface Canvas {
    ready: boolean;
}

interface UI {
    notifications: Notifications;
}

interface Notifications {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export { };

