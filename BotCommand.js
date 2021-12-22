class BotCommand {
    constructor(keyword, description, usage, alias, callback) {
        this.keyword = keyword;
        this.description = description;
        this.usage = usage;
        this.alias = alias;
        this.callback = callback;
    }
}

module.exports = BotCommand;