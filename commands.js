const ScriptLoader = require('./ScriptLoader.js');
const { BotCommand, CommandCategories } = require('./BotCommand.js');
const { FormDataEncoder } = require('form-data-encoder');
const { MentionType } = require('./utils/utils.js');
const { exit } = require("process");
const fs = require('fs');

const utilsLoader = new ScriptLoader('./utils/utils.js');
const utils = () => { return utilsLoader.script };

const imageUtilsLoader = new ScriptLoader('./utils/image-utils.js');
const imageUtils = () => { return imageUtilsLoader.script };

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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'mleyot', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'buaya', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );

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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'oleng', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'emosi', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'troll', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'kedip', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'oops', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'senyum', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
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

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'kero', 'gif');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
    }
);

const beban = new BotCommand(
    'beban',
    'Nyindir si beban.',
    process.env.CMD_PREFIX + ' beban',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu beban]");

        const data = {
            image_process_call: {
                image_url: '',
                methods_list: {
                    method: {
                        name: 'collage',
                        params: 'template_name=heavy_load'
                    }
                },
                template_watermark: false,
            }
        };
        console.log(data.image_process_call.methods_list.method);

        const u1cb = () => {
            const targetId = msgData.mentions[0].id;
            const targetUrl = utils().getUserAvatarUrl(targetId, msgData.mentions[0].avatar, 512);
            data.image_process_call.image_url = targetUrl;
            const dataXml = utils().buildXml(data);

            handlePhotoCommand(msgData, dataXml, 'beban', 'png');
        };

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
    }
);

const nikahin = new BotCommand(
    'nikahin',
    'Akta nikah adalah bukti.',
    process.env.CMD_PREFIX + ' nikahin @target1 @target2[optional]',
    null,
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu nikahin]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;

        const u2cb = () => {
            const target1Data = msgData.mentions[0];
            let target2Data;

            if (msgData.mentions.length == 1) {
                target2Data = msgData.mentions[0];
            } else {
                target2Data = msgData.mentions[1];
            }

            const target1Id = target1Data.id;
            const target2Id = target2Data.id;

            let target1Name = target1Data.member.nick;
            let target2Name = target2Data.member.nick;

            if (target1Name == null) {
                target1Name = target1Data.username;
            }

            if (target2Name == null) {
                target2Name = target2Data.username;
            }

            target1Name = utils().removeNonAscii(target1Name);
            target2Name = utils().removeNonAscii(target2Name);

            if (target1Name.length == 0) {
                target1Name = '??';
            }

            if (target2Name.length == 0) {
                target2Name = '??';
            }

            if (target1Name.length > 10) {
                target1Name = target1Name.slice(0, 10);
            }

            if (target2Name.length > 10) {
                target2Name = target2Name.slice(0, 10);
            }

            target1Name = utils().capitalizeFirstLetterEachWord(target1Name);
            target2Name = utils().capitalizeFirstLetterEachWord(target2Name);

            if (target1Data.avatar == null) {
                utils().sendMessage(guildId, channelId, `*Nampaknya <@${target1Id}> ndak punya avatar.*`);
                return;
            } else if (target2Data.avatar == null) {
                utils().sendMessage(guildId, channelId, `*Nampaknya <@${target2Id}> ndak punya avatar.*`);
                return;
            }

            const target1Url = utils().getUserAvatarUrl(target1Id, target1Data.avatar, 64);
            const target2Url = utils().getUserAvatarUrl(target2Id, target2Data.avatar, 64);

            imageUtils().generateAktaNikah(target1Url, target1Name, target2Url, target2Name).then((blob) => {
                utils().sendImage(guildId, channelId, blob, `aktanikah_${target1Id}_${target2Id}_${(new Date()).getTime()}.png`);
            });
        };

        const u1cb = () => {
            const target1Id = msgData.author.id;
            const target2Id = msgData.mentions[0].id;

            let target1Name;
            let target2Name;

            target1Name = utils().removeNonAscii(msgData.member.nick);
            target2Name = utils().removeNonAscii(msgData.mentions[0].member.nick);

            if (target1Name.length == 0) {
                target1Name = '??';
            }

            if (target2Name.length == 0) {
                target2Name = '??';
            }

            if (target1Name.length > 10) {
                target1Name = target1Name.slice(0, 10);
            }

            if (target2Name.length > 10) {
                target2Name = target2Name.slice(0, 10);
            }

            target1Name = utils().capitalizeFirstLetterEachWord(target1Name);
            target2Name = utils().capitalizeFirstLetterEachWord(target2Name);

            if (msgData.author.avatar == null) {
                utils().sendMessage(guildId, channelId, `*Nampaknya <@${target1Id}> ndak punya avatar.*`);
                return;
            } else if (msgData.mentions[0].avatar == null) {
                utils().sendMessage(guildId, channelId, `*Nampaknya <@${target2Id}> ndak punya avatar.*`);
                return;
            }

            const target1Url = utils().getUserAvatarUrl(target1Id, msgData.author.avatar, 64);
            const target2Url = utils().getUserAvatarUrl(target2Id, msgData.mentions[0].avatar, 64);

            imageUtils().generateAktaNikah(target1Url, target1Name, target2Url, target2Name).then((blob) => {
                utils().sendImage(guildId, channelId, blob, `aktanikah_${target1Id}_${target2Id}_${(new Date()).getTime()}.png`);
            });
        };

        const userAndRoleCb = () => {
            utils().sendMessage(guildId, channelId, '*Buseet dahh, jangan satu role juga kau nikahin mz... -_-*');
        };

        const r2cb = () => {
            utils().sendMessage(guildId, channelId, '*Gilaakk, mau ngejodohin dua role mz??*');
        };

        const nmcb = () => {
            utils().sendMessage(guildId, channelId, '*Mo nikahin setan apa gmn mz? kok gk mention someone...\\nApa jangan2 km **JOMBLO** tp pengen nikah?*');
        };

        utils().handleMentioningMessage(
            msgData,
            u2cb,
            userAndRoleCb,
            u1cb,
            r2cb,
            userAndRoleCb,
            userAndRoleCb,
            nmcb
        );
    }
);

const baloncinta = new BotCommand(
    'baloncinta',
    'Lop uuuuu <3 <3',
    process.env.CMD_PREFIX + ' baloncinta',
    'bc',
    CommandCategories.image,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu baloncinta]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;

        const data = (url1, url2) => {
            return String.raw`<image_process_call>
            <image_url order="1">${url1}</image_url>
            <image_url order="2">${url2}</image_url>
            <methods_list>
            <method order="1">
               <name>collage</name>
               <params>template_name=heavenly_love;crop_portrait=TRUE
               </params>
            </method>
            </methods_list>
            <template_watermark>false</template_watermark>
            </image_process_call>`;
        };

        const u1cb = () => {
            utils().sendMessage(guildId, channelId, '*Command ini butuh 2 tag y mz...*');
        };

        const u2cb = () => {
            const target1Id = msgData.mentions[0].id;
            const target2Id = msgData.mentions[1].id;

            const target1Url = utils().getUserAvatarUrl(target1Id, msgData.mentions[0].avatar, 512);
            const target2Url = utils().getUserAvatarUrl(target2Id, msgData.mentions[1].avatar, 512);

            const dataXml = data(target1Url, target2Url);

            handlePhotoCommand(msgData, dataXml, 'baloncinta', 'png');
        }

        utils().handleMentioningMessage(
            msgData,
            u2cb,
            utils().emptycb,
            u1cb
        );
    }
);

function handlePhotoCommand(msgData, dataXml, filename_prefix, filename_suffix) {
    const guildId = msgData.guild_id;
    const channelId = msgData.channel_id;
    const targetId = msgData.mentions[0].id;
    const targetAvaHash = msgData.mentions[0].avatar;

    utils().sendPhotoTask(dataXml).then((response) => {
        const { image_process_response } = utils().parseXml(response.data);
        if (image_process_response.status == 'OK') {
            const getPhotoResult = () => {
                utils().getPhotoResult(image_process_response.request_id).then((response) => {
                    const { image_process_response } = utils().parseXml(response.data);
                    if (image_process_response.status == 'OK') {
                        utils().fetchImageBlob(image_process_response.result_url).then((response) => {
                            const filename = `${filename_prefix}_${targetId}_${targetAvaHash}.${filename_suffix}`;
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
                    } else if (image_process_response.err_code == -2) {
                        utils().sendMessage(guildId, channelId, `*Nampaknya <@${targetId} nggak punya pp...>*`);
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

}

module.exports = [ping, randomQuote, logchat, stoplogchat, mleyot, buaya, oleng, emosi, troll, kedip, oops, senyum, kero, baloncinta, nikahin, beban, help];
