class BotCommand {
    constructor(keyword, description, usage, alias, category, callback) {
        this.keyword = keyword;
        this.description = description;
        this.usage = usage;
        this.alias = alias;
        this.category = category;
        this.callback = callback;
    }
}

class CommandCategories {
    static getList() { return [this.others, this.text, this.image] };

    static others = 'Lain-lain';
    static text = 'Teks';
    static image = 'Gambar';
}

module.exports = { BotCommand: BotCommand, CommandCategories: CommandCategories };