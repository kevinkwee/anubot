const {
    BotCommand,
    CommandCategories
} = require('../BotCommand.js');

const ScriptLoader = require('../../ScriptLoader');

const utilsLoader = new ScriptLoader(__dirname + '/../../utils/utils.js');
const utils = () => { return utilsLoader.script };

const imageUtilsLoader = new ScriptLoader(__dirname + '/../../utils/image-utils.js');
const imageUtils = () => { return imageUtilsLoader.script };

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

const mleyot = new BotCommand(
    'mleyot',
    'Mleyotin avatar someone',
    process.env.CMD_PREFIX + ' mleyot @user',
    [],
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
    [],
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
    [],
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
    [],
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
    [],
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
    [],
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
    [],
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
    [],
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
    [],
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
    [],
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
    [],
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

            let target1Name = msgData.member.nick;
            let target2Name = msgData.mentions[0].member.nick;

            if (target1Name == null) {
                target1Name = msgData.author.username;
            }

            if (target2Name == null) {
                target2Name = msgData.mentions[0].username;
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
            utils().sendMessage(guildId, channelId, '*Mo nikahin sapa mz? kok gk mention someone...\\nApa jangan2 km **JOMBLO** tp pengen nikah?*');
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
    ['bc'],
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

module.exports = [mleyot, buaya, oleng, emosi, troll, kedip, oops, senyum, kero, beban, nikahin, baloncinta];
