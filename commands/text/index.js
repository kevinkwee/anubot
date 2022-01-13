const ScriptLoader = require('../../ScriptLoader');
const fs = require('fs');

const {
    BotCommand,
    CommandCategories
} = require('../BotCommand.js');

const {
    getAdminList,
    getOwnerList
} = require('../../repositories/firebase-rtdb');

const {
    getGuildMusicPlayer
} = require('../music/bot-data');

const utilsLoader = new ScriptLoader(__dirname + '/../../utils/utils.js');
const utils = () => { return utilsLoader.script };

let logchatCallback;

var logchatUser = null;

const randomQuote = new BotCommand(
    'randomquote',
    'Bctan randomm',
    process.env.CMD_PREFIX + ' randomquote',
    ['rq'],
    CommandCategories.text,
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
    process.env.CMD_PREFIX + ' logchat @user',
    ['lc'],
    CommandCategories.text,
    (msgData, ws) => {
        console.log();
        console.log("[Command detected] [anu logchat]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;

        const msgDataSplit = msgData.content.splitByWhitespace();

        if (msgDataSplit.length >= 3) {
            if (msgDataSplit[2].startsWith("<@") && msgDataSplit[2].endsWith(">")) {
                let listenerCountComparator = 1;

                if (getGuildMusicPlayer(guildId)) {
                    listenerCountComparator = 2;
                }

                if (ws.listenerCount("message") > listenerCountComparator) {
                    utils().sendMessage(guildId, channelId, "*Maksimal satu logger y mz..*");
                    return;
                }
                const targetUid = msgDataSplit[2].slice(2, -1);
                let lastContent = String.raw`**Catetan chat <@${targetUid}>**\n*klo bot ini spam salahin <@${msgData.author.id}>*`;
                let lastBotMsgId = "";
                const msgContent = String.raw`${lastContent}\n> *Blom ngechat*`;
                utils().sendMessage(guildId, channelId, msgContent).then((response) => {
                    logchatUser = msgData.author.id;
                    lastBotMsgId = response.data.id;
                    const logMsg = (data) => {
                        const regex = /\n/g;
                        let payload = JSON.parse(data);
                        const { t, op, d } = payload;
                        if (op == 0 && t == 'MESSAGE_CREATE') {
                            if (d.author.id == targetUid || `!` + d.author.id == targetUid) {
                                let newMsgContent = lastContent + String.raw`\n> **<t:${Math.floor((new Date(d.timestamp)).getTime() / 1000)}>**\n> *${(d.content).replace(regex, ` `).replace(/\\/g, ``)}*`;
                                if (newMsgContent.length >= 2000) {
                                    newMsgContent = String.raw`**Catetan chat <@${targetUid}>**\n*klo bot ini spam salahin <@${msgData.author.id}>*` + String.raw`\n> **<t:${Math.floor((new Date(d.timestamp)).getTime() / 1000)}>**\n> *${(d.content).replace(regex, ` `).replace(/\\/g, ``)}*`;
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
                    logchatCallback = logMsg;
                });
            }
        }
    },
);

const stoplogchat = new BotCommand(
    'stoplogchat',
    'Buat berhentiin log chat',
    process.env.CMD_PREFIX + ' stoplogchat',
    ['slc'],
    CommandCategories.text,
    (msgData, ws) => {
        console.log();
        console.log("[Command detected] [anu stoplogchat]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgAuthorId = msgData.author.id;

        const isPrivilegedUser = utils().isPrivilegedUser(getOwnerList(), getAdminList(), msgAuthorId);

        if (!isPrivilegedUser) {
            if (msgData.author.id != logchatUser) {
                utils().sendMessage(guildId, channelId, "*Ih kmu sapa, km bukan yg ngidupin logchat tadi...\\nGabole matiin punya orang...*");
                return;
            }
        }

        let listenerCountComparator = 1;

        if (getGuildMusicPlayer(guildId)) {
            listenerCountComparator = 2;
        }

        if (ws.listenerCount("message") > listenerCountComparator) {
            ws.removeListener("message", logchatCallback);
            logchatUser = null;
            utils().sendMessage(guildId, channelId, "*Logchat uda kustop yaa..*");
        } else {
            utils().sendMessage(guildId, channelId, "*Ndak ada logchat yg jalan mz..*");
        }
    }
);

module.exports = [randomQuote, logchat, stoplogchat];
