const fs = require('fs');

class ScriptLoader {
    constructor(path) {
        this.#path = path;
        fs.watch(this.#path, (event, name) => {
            if (event !== 'change') return;
            console.log(`[${name} CHANGED] [RELOADING]`);
            this.loadScript();
        });
        this.loadScript();
    }

    #path;
    script;

    loadScript() {
        if (this.script) {
            if (typeof this.script.teardown === 'function') {
                this.script.teardown();
            }
            delete require.cache[require.resolve(this.#path)];
        }

        this.script = require(this.#path);
    }

}

module.exports = ScriptLoader;