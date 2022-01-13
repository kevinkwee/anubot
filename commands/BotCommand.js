class BotCommand {
    /**
     * @param {String} keyword 
     * @param {String} description 
     * @param {String} usage 
     * @param {String[]} alias 
     * @param {CommandCategories} category 
     * @param {(msgData: JSON, ws: WebSocket) => void} callback 
     */
    constructor(keyword, description, usage, aliases, category, callback) {
        this.keyword = keyword;
        this.description = description;
        this.usage = usage;
        this.aliases = aliases;
        this.category = category;
        this.callback = callback;
    }
}

class CommandCategories {
    static getList() { return [this.others, this.text, this.image, this.music, this.hanyaOwner] };

    static others = 'Lain-lain';
    static text = 'Teks';
    static image = 'Gambar';
    static hanyaOwner = 'Hanya Owner';
    static music = 'Musik';
}

module.exports = { BotCommand: BotCommand, CommandCategories: CommandCategories };
