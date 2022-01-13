const {
    BotCommand,
    CommandCategories
} = require('../BotCommand.js');

const commandsWithoutOthers = require('../command-index-without-others');

const ScriptLoader = require('../../ScriptLoader');

const utilsLoader = new ScriptLoader(__dirname + '/../../utils/utils.js');
const utils = () => { return utilsLoader.script };

const ping = new BotCommand(
    'ping',
    'Buat cek delay anu 🤖',
    process.env.CMD_PREFIX + ' ping',
    [],
    CommandCategories.others,
    (msgData) => {
        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const receivedTimestamp = new Date().getTime();
        const userMsgTimestamp = new Date(msgData.timestamp).getTime();
        const ping = receivedTimestamp - userMsgTimestamp;

        console.log();
        console.log("[Command detected] [anu ping]");
        utils().sendMessage(guildId, channelId, "", [{
            title: "PONG!! 🏓 HALOO",
            color: 65280,
            description: `📶 *Latency: ${ping}ms*`,
        }]);
    },
);

const help = new BotCommand(
    'help',
    'Kalo gapaham bisa buka ini',
    process.env.CMD_PREFIX + ' help',
    ['h'],
    CommandCategories.others,
    (msgData) => {
        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgDataSplit = msgData.content.splitByWhitespace();
        const commands = [...commandsWithoutOthers, ...module.exports];
        let embeds;

        // Detail help command
        if (msgDataSplit.length >= 3) {
            commands.forEach(botcmd => {
                if (msgDataSplit[2].toLowerCase() === botcmd.keyword) {
                    let fields = [
                        {
                            name: "Deskripsi",
                            value: '`' + botcmd.description + '`'
                        },
                        {
                            name: "Cara pake",
                            value: '`' + botcmd.usage + '`',
                        }
                    ];

                    if (botcmd.aliases.length >= 1) {
                        let field = {
                            name: "Alias",
                            value: ''
                        };
                        botcmd.aliases.forEach((alias) => {
                            field.value += ', `' + alias + '`';
                        });

                        field.value = field.value.slice(2);
                        fields.push(field);
                    }

                    embeds = {
                        title: "Command",
                        description: "`" + botcmd.keyword + "`",
                        color: 10717951,
                        fields: fields
                    }
                }
            });
        }

        // List command
        if (embeds == undefined) {
            let fields = [];
            CommandCategories.getList().forEach(category => {
                let field = {
                    name: category,
                    value: ""
                };
                commands.forEach((botcmd) => {
                    if (botcmd.category == category) {
                        field.value += ', `' + botcmd.keyword + '`';
                    }
                });
                field.value = field.value.slice(2);

                if (!field.value) {
                    field.value = '-';
                }

                fields.push(field);
            });

            embeds = {
                title: "Buat yg Blom Tau ato Lupa",
                color: 10717951,
                description: "--------------------",
                timestamp: null,
                footer: {
                    text: "Buat liat detail: anu help <command>",
                },
                fields: fields
            };
        }

        console.log();
        console.log("[Command detected] [anu help]");
        console.log(embeds);
        utils().sendMessage(guildId, channelId, "", [embeds]);
    }
);

module.exports = [ping, help];
