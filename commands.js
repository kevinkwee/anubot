const BotCommand = require('./BotCommand.js');
const ScriptLoader = require('./ScriptLoader.js');
const { exit } = require("process");
const fs = require('fs');

const utilsLoader = new ScriptLoader('./utils.js');
const utils = () => { return utilsLoader.script };

const ping = new BotCommand(
    'ping',
    'Buat cek delay anu 🤖',
    process.env.CMD_PREFIX + ' ping',
    null,
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

const exitBot = new BotCommand(
    'exit',
    'Buat ngusir anu 🤖',
    process.env.CMD_PREFIX + ' exit',
    null,
    (msgData, ws) => {
        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;

        console.log();
        console.log("[Command detected] [anu exit]");
        console.log("Sending bye-bye message...");
        utils().sendMessage(guildId, channelId, "> **Aku pamit yaa**\\n> **Dadaaahhh... :wave:**").then(() => {
            utils().editServerNick(guildId, process.env.OFFLINE_NICK).then(() => {
                console.log("Closing websocket...");
                ws.close();
                exit(0);
            });
        });
    },
);

const help = new BotCommand(
    'help',
    'Kalo gapaham bisa buka ini',
    process.env.CMD_PREFIX + ' help',
    null,
    (msgData) => {
        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;

        let fields = [];
        module.exports.forEach(botcmd => {
            fields.push({
                name: botcmd.keyword,
                value: botcmd.description
            });
        });

        const embeds = {
            title: "Buat yg Blom Tau ato Lupa",
            color: 10717951,
            description: "Daftar perintah anu",
            timestamp: null,
            thumbnail: {
                url: "https://instagram.fsrg5-1.fna.fbcdn.net/v/t51.2885-15/sh0.08/e35/s640x640/82514631_1027642580947332_2963482880134908064_n.jpg?_nc_ht=instagram.fsrg5-1.fna.fbcdn.net&_nc_cat=100&_nc_ohc=R8BoqcjuLlEAX9RbmCT&edm=AP_V10EBAAAA&ccb=7-4&oh=00_AT_gjUTmZisfETwAYH4bLoA1PWF9w1MDIhpZ-5rwal1R1Q&oe=61C9D0B5&_nc_sid=4f375e"
            },
            footer: {
                text: "Cara pake: anu <command> [args1] [args2] ...",
                icon_url: "https://instagram.fsrg5-1.fna.fbcdn.net/v/t51.2885-15/sh0.08/e35/s640x640/82514631_1027642580947332_2963482880134908064_n.jpg?_nc_ht=instagram.fsrg5-1.fna.fbcdn.net&_nc_cat=100&_nc_ohc=R8BoqcjuLlEAX9RbmCT&edm=AP_V10EBAAAA&ccb=7-4&oh=00_AT_gjUTmZisfETwAYH4bLoA1PWF9w1MDIhpZ-5rwal1R1Q&oe=61C9D0B5&_nc_sid=4f375e"
            },
            fields: fields
        };

        console.log();
        console.log("[Command detected] [anu help]");
        utils().sendMessage(guildId, channelId, "", [embeds]);
    }
);

const randomQuote = new BotCommand(
    'randomquote',
    'Bctan randomm',
    'anu randomquote / anu rq',
    'rq',
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu randomquote]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        let quoteList;
        let quoteCursor;

        try {
            console.log("Reading quote data file...");
            const quoteData = fs.readFileSync('./quoteData.json');
            const quoteDataJson = JSON.parse(quoteData);
            quoteList = quoteDataJson.quoteList;
            quoteCursor = quoteDataJson.quoteCursor;
            console.log("Read success!");
        } catch (error) {
            console.log("Read failed!");
            quoteList = [];
            quoteCursor = 0;
        }

        utils().sendMessage(guildId, channelId, "*Mikir bentar ya mz...*").then(
            (successResponse) => {
                if (quoteList.length == 0 || quoteCursor == 49) {
                    utils().getRandomQuote().then(
                        (data) => {
                            quoteList = data;
                            const content = "> *\\\"" + quoteList[quoteCursor].q + "\\\"*\\n> **— " + quoteList[quoteCursor].a + "**";
                            utils().editMessage(guildId, channelId, successResponse.data.id, content).then(() => {
                                quoteCursor++;
                                try {
                                    console.log("Writing quote data file...");
                                    const quoteData = {
                                        quoteList: quoteList,
                                        quoteCursor: quoteCursor
                                    };
                                    fs.writeFileSync('./quoteData.json', JSON.stringify(quoteData));
                                    console.log("Write success!");
                                } catch (error) {
                                    console.log("Write failed!");
                                }
                            });
                        },
                        (errorMsg) => {
                            const content = '> ' + errorMsg;
                            utils().editMessage(guildId, channelId, successResponse.data.id, content);
                        }
                    );
                } else {
                    const content = "> *\\\"" + quoteList[quoteCursor].q + "\\\"*\\n> **— " + quoteList[quoteCursor].a + "**";
                    utils().editMessage(guildId, channelId, successResponse.data.id, content).then(() => {
                        quoteCursor++;
                        try {
                            console.log("Writing quote data file...");
                            const quoteData = {
                                quoteList: quoteList,
                                quoteCursor: quoteCursor
                            };
                            fs.writeFileSync('./quoteData.json', JSON.stringify(quoteData));
                            console.log("Write success!");
                        } catch (error) {
                            console.log("Write failed!");
                        }
                    });
                }
            }
        );
    }
);

const logchat = new BotCommand(
    'logchat',
    'buat nyatet chat org yg suka chat apus chat apus',
    'anu lc <mention>',
    'lc',
    (msgData, ws) => {
        console.log();
        console.log("[Command detected] [anu logchat]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const regex = /\n/g;

        const msgDataSplit = msgData.content.split(" ");

        if (msgDataSplit.length >= 3) {
            if (msgDataSplit[2].startsWith("<@") && msgDataSplit[2].endsWith(">")) {
                if (ws.listenerCount("message") > 1) {
                    utils().sendMessage(guildId, channelId, "*Maksimal satu logger y mz..*");
                    return;
                }
                const targetUid = msgDataSplit[2].slice(2, -1);
                let lastContent = String.raw`**Catetan chat <@${targetUid}>**`;
                let lastBotMsgId = "";
                const msgContent = String.raw`${lastContent}\n> *Blom ngechat*`;
                utils().sendMessage(guildId, channelId, msgContent).then((response) => {
                    lastBotMsgId = response.data.id;
                    const logMsg = (data) => {
                        let payload = JSON.parse(data);
                        const { t, s, op, d } = payload;
                        if (op == 0 && t == 'MESSAGE_CREATE') {
                            if (d.author.id == targetUid || `!` + d.author.id == targetUid) {
                                let newMsgContent = lastContent + String.raw`\n> **[${(new Date(d.timestamp)).toLocaleString()}]**\n> *${(d.content).replace(regex, `\\n`)}*`;
                                if (newMsgContent.length >= 2000) {
                                    newMsgContent = String.raw`**Catetan chat <@${targetUid}>**` + String.raw`\n> **[${(new Date(d.timestamp)).toLocaleString()}]**\n> *${(d.content).replace(regex, `\\n`)}*`;
                                }
                                utils().sendMessage(guildId, channelId, newMsgContent).then((newResponse) => {
                                    lastContent = newResponse.data.content.replace(regex, `\\n`);
                                    utils().deleteMessage(guildId, channelId, lastBotMsgId);
                                    lastBotMsgId = newResponse.data.id;
                                });
                            }
                        }
                    }
                    ws.on('message', logMsg);
                });
            }
        }
    },
);

const stoplogchat = new BotCommand(
    'stoplogchat',
    'Buat berhentiin log chat',
    'anu stoplogchat',
    'slc',
    (msgData, ws) => {
        console.log();
        console.log("[Command detected] [anu stoplogchat]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;

        if (ws.listenerCount("message") > 1) {
            ws.removeListener("message", ws.listeners("message")[1]);
            utils().sendMessage(guildId, channelId, "*Logchat uda kustop yaa..*");
        } else {
            utils().sendMessage(guildId, channelId, "*Ndak ada logchat yg jalan mz..*");
        }
    }
);

module.exports = [ping, randomQuote, logchat, stoplogchat, exitBot, help];
