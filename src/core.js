'use strict';

module.exports = class Core extends Events {

    constructor (options = {}) {
        super();
        this.debug = options.debug || false;
        this.handlers = options.handlers || [];
        this.listeners = options.listeners || [];
    }

    error () {

    }

    hook () {

        Promise.resolve().then(async => {

            for (const handler of this.handlers) {
                if (context.response.closed || context.response.aborted || context.response.destroyed || context.response.writableEnded) {
                    break;
                } else {
                    await (handler.handler || handler).call(handler, context);
                }
            }

            if (!context.response.closed && !context.response.aborted && !context.response.destroyed && !context.response.writableEnded) {
                context.end();
            }

        }).catch(error => {
            context.code = 500;
            context.message = this.debug ? error.message : 'internal server error';
            context.body = { code: context.code, message: context.message };
            context.end();
            this.emit('handler:error', error);
        });

    }

    async handler (handler) {
        this.handlers.push(handler);
    }

    async listener (listener) {
        const hook = this.hook.bind(this, listener);
        const error = this.error.bind(this, listener);
        await listener.create(hook, error);
        this.listeners.push(listener);
    }

    async open () {
        await Promise.all(this.listeners.map(listener => listener.open()));
        this.emit('open');
    }

    async close () {
        await Promise.all(this.listeners.map(listener => listener.close()));
        this.emit('close');
    }

}
