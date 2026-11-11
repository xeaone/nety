interface ManagedHandle {
    open(): unknown;
    close(): unknown;
}

interface ManagedListener extends ManagedHandle {
    handles: unknown[];
    add(handle: unknown): unknown;
}

interface ControllerOptions {
    handles?: ManagedHandle[];
    listener?: ManagedListener[];
    listeners?: ManagedListener[];
    [key: string]: unknown;
}

export default class Controller {
    handles: ManagedHandle[] = [];
    listeners: ManagedListener[] = [];
    options: Record<string, unknown> = {};

    constructor(options: ControllerOptions = {}) {
        this.handles = options.handles || this.handles;
        this.listeners = options.listeners || options.listener || this.listeners;

        this.options = { ...options };

        delete this.options.handles;
        delete this.options.listener;
        delete this.options.listeners;
    }

    async add(handle: unknown): Promise<void> {
        this.listeners.forEach((listener) => listener.add(handle));
    }

    async listener(listener: ManagedListener): Promise<void> {
        Array.prototype.push.apply(listener.handles, this.handles);
        Object.assign(listener, this.options);
        this.listeners.push(listener);
    }

    async open(): Promise<unknown[]> {
        return Promise.all(this.handles.map((handle) => handle.open()));
    }

    async close(): Promise<unknown[]> {
        return Promise.all(this.handles.map((handle) => handle.close()));
    }
}
