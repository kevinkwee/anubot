const { BotCommand, CommandCategories } = require('./BotCommand.js');
const ScriptLoader = require('./ScriptLoader.js');
const { FormDataEncoder } = require('form-data-encoder');
const { exit } = require("process");
const fs = require('fs');

const utilsLoader = new ScriptLoader('./utils.js');
const utils = () => { return utilsLoader.script };

const ping = new BotCommand(
    'ping',
    'Buat cek delay anu 🤖',
    process.env.CMD_PREFIX + ' ping',
    null,
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
    null,
    CommandCategories.others,
    (msgData) => {
        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgDataSplit = msgData.content.split(" ");

        let embeds;

        if (msgDataSplit.length >= 3) {
            module.exports.forEach(botcmd => {
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

                    if (botcmd.alias != null) {
                        fields.push({
                            name: "Alias",
                            value: '`' + botcmd.alias + '`'
                        });
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

        if (embeds == undefined) {
            let fields = [];
            CommandCategories.getList().forEach(category => {
                let field = {
                    name: category,
                    value: ""
                };
                module.exports.forEach((botcmd, index) => {
                    if (botcmd.category == category) {
                        field.value += ', `' + botcmd.keyword + '`';
                    }
                });
                field.value = field.value.slice(2);
                fields.push(field);
            });

            embeds = {
                title: "Buat yg Blom Tau ato Lupa",
                color: 10717951,
                description: "--------------------",
                timestamp: null,
                thumbnail: {
                    url: "https://instagram.fsrg5-1.fna.fbcdn.net/v/t51.2885-15/sh0.08/e35/s640x640/82514631_1027642580947332_2963482880134908064_n.jpg?_nc_ht=instagram.fsrg5-1.fna.fbcdn.net&_nc_cat=100&_nc_ohc=R8BoqcjuLlEAX9RbmCT&edm=AP_V10EBAAAA&ccb=7-4&oh=00_AT_gjUTmZisfETwAYH4bLoA1PWF9w1MDIhpZ-5rwal1R1Q&oe=61C9D0B5&_nc_sid=4f375e"
                },
                footer: {
                    text: "Buat liat detail: anu help <command>",
                    icon_url: "https://instagram.fsrg5-1.fna.fbcdn.net/v/t51.2885-15/sh0.08/e35/s640x640/82514631_1027642580947332_2963482880134908064_n.jpg?_nc_ht=instagram.fsrg5-1.fna.fbcdn.net&_nc_cat=100&_nc_ohc=R8BoqcjuLlEAX9RbmCT&edm=AP_V10EBAAAA&ccb=7-4&oh=00_AT_gjUTmZisfETwAYH4bLoA1PWF9w1MDIhpZ-5rwal1R1Q&oe=61C9D0B5&_nc_sid=4f375e"
                },
                fields: fields
            };
        }

        console.log();
        console.log("[Command detected] [anu help]");
        utils().sendMessage(guildId, channelId, "", [embeds]);
    }
);

const randomQuote = new BotCommand(
    'randomquote',
    'Bctan randomm',
    process.env.CMD_PREFIX + ' randomquote',
    'rq',
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
    'lc',
    CommandCategories.text,
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
                let lastContent = String.raw`**Catetan chat <@${targetUid}>**\n*klo bot ini spam salahin <@${msgData.author.id}>*`;
                let lastBotMsgId = "";
                const msgContent = String.raw`${lastContent}\n> *Blom ngechat*`;
                utils().sendMessage(guildId, channelId, msgContent).then((response) => {
                    lastBotMsgId = response.data.id;
                    const logMsg = (data) => {
                        let payload = JSON.parse(data);
                        const { t, s, op, d } = payload;
                        if (op == 0 && t == 'MESSAGE_CREATE') {
                            if (d.author.id == targetUid || `!` + d.author.id == targetUid) {
                                let newMsgContent = lastContent + String.raw`\n> **[${(new Date(d.timestamp)).toLocaleString()}]**\n> *${(d.content).replace(regex, ` `).replace(/\\/g, ``)}*`;
                                if (newMsgContent.length >= 2000) {
                                    newMsgContent = String.raw`**Catetan chat <@${targetUid}>**\n*klo bot ini spam salahin <@${msgData.author.id}>*` + String.raw`\n> **[${(new Date(d.timestamp)).toLocaleString()}]**\n> *${(d.content).replace(regex, ` `).replace(/\\/g, ``)}*`;
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
    process.env.CMD_PREFIX + ' stoplogchat',
    'slc',
    CommandCategories.text,
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

const mleyot = new BotCommand(
    'mleyot',
    'Mleyotin avatar someone',
    process.env.CMD_PREFIX + ' mleyot @user',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu mleyot]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=water_flow'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'mleyot', 'gif');
    },
);

const buaya = new BotCommand(
    'buaya',
    'Mata lope lope [KHUSUS WAJAH]',
    process.env.CMD_PREFIX + ' buaya',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu buaya]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=heart_eyes'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'buaya', 'gif');
    }
);

const oleng = new BotCommand(
    'oleng',
    'Mata oleng [KHUSUS WAJAH]',
    process.env.CMD_PREFIX + ' oleng',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu oleng]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=rolling_eyes'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'oleng', 'gif');
    }
);

const emosi = new BotCommand(
    'emosi',
    'Mata marah [KHUSUS WAJAH]',
    process.env.CMD_PREFIX + ' emosi',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu emosi]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=blazing_eyes'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'emosi', 'gif');
    }
);

const troll = new BotCommand(
    'troll',
    'Raut ngetroll [KHUSUS WAJAH]',
    process.env.CMD_PREFIX + ' troll',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu troll]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=cartoon_troll'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'troll', 'gif');
    }
);

const kedip = new BotCommand(
    'kedip',
    'Raut ngedip [KHUSUS WAJAH]',
    process.env.CMD_PREFIX + ' kedip',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu kedip]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=cartoon_wink'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'kedip', 'gif');
    }
);

const oops = new BotCommand(
    'oops',
    'Woopss [KHUSUS WAJAH]',
    process.env.CMD_PREFIX + ' oops',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu oops]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=cartoon_oops'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'oops', 'gif');
    }
);

const senyum = new BotCommand(
    'senyum',
    'Lagi seneng [KHUSUS WAJAH]',
    process.env.CMD_PREFIX + ' senyum',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu senyum]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=cartoon_smile'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'senyum', 'gif');
    }
);

const kero = new BotCommand(
    'kero',
    'Lagi pusying [KHUSUS WAJAH]',
    process.env.CMD_PREFIX + ' kero',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu kero]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'animated_effect',
                        params: 'template_name=cartoon_squint'
                    }
                }
            }
        };

        handlePhotoCommand(msgData, data, 'kero', 'gif');
    }
);

function handlePhotoCommand(msgData, data, filename_prefix, filename_suffix) {
    const guildId = msgData.guild_id;
    const channelId = msgData.channel_id;

    if (utils().checkIsMsgMentioning(msgData)) {
        const targetUid = utils().getMentionedUser(msgData);

        utils().getUser(targetUid).then((response) => {
            const avatarHash = response.data.avatar;
            const avatarUrl = `https://cdn.discordapp.com/avatars/${targetUid}/${avatarHash}.png?size=512`;
            data.image_process_call.image_url = avatarUrl;
            const dataXml = utils().buildXml(data);

            utils().sendPhotoTask(dataXml).then((response) => {
                const { image_process_response } = utils().parseXml(response.data);
                if (image_process_response.status == 'OK') {
                    const getPhotoResult = () => {
                        utils().getPhotoResult(image_process_response.request_id).then((response) => {
                            const { image_process_response } = utils().parseXml(response.data);
                            if (image_process_response.status == 'OK') {
                                utils().fetchImageBlob(image_process_response.result_url).then((response) => {
                                    const filename = `${filename_prefix}_${targetUid}_${avatarHash}.${filename_suffix}`;
                                    utils().sendImage(guildId, channelId, response.data, filename);
                                });
                            } else if (image_process_response.status == 'InProgress') {
                                console.log("Pho.to result is in progress. Waiting for 0.5s before retrying...");
                                setTimeout(() => {
                                    console.log("Retry to get pho.to result...");
                                    getPhotoResult();
                                }, 500);
                            } else if (image_process_response.err_code == -1000) {
                                utils().sendMessage(guildId, channelId, "*Khusus command ini pake foto yg wajahnya jelas ya mz...*");
                            } else {
                                utils().sendMessage(guildId, channelId, "*Maaf baru error mz...*\\n*Cepet benerin woi <@545945146051526656>*\\n**Get result " + image_process_response.status + ": " + image_process_response.err_code + "**");
                            }
                        });
                    };
                    getPhotoResult();
                } else {
                    utils().sendMessage(guildId, channelId, "*Maaf baru error mz...*\\n*Cepet benerin woi <@545945146051526656>*\\n**Send task " + image_process_response.status + ": " + image_process_response.err_code + "**");
                }
            });
        });
    }
}

module.exports = [ping, randomQuote, logchat, stoplogchat, mleyot, buaya, oleng, emosi, troll, kedip, oops, senyum, kero, help];
