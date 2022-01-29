const ScriptLoader = require('../../ScriptLoader');

const {
    BotCommand,
    CommandCategories
} = require('../BotCommand.js');

const {
    getAppDatabase,
    getAdminList,
    getOwnerList,
    ADMINS_PATH
} = require('../../repositories/firebase-rtdb');

const { ref, set } = require('firebase/database');

const utilsLoader = new ScriptLoader(__dirname + '/../../utils/utils.js');
const utils = () => { return utilsLoader.script };

const addAdmin = new BotCommand(
    'addadmin',
    'Buat nambah admin',
    process.env.CMD_PREFIX + ' addadmin',
    ['aadm'],
    CommandCategories.hanyaOwner,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu addadmin]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgAuthorId = msgData.author.id;
        const msgDataSplit = msgData.content.splitByWhitespace();

        const isPrivilegedUser = utils().isPrivilegedUser(getOwnerList(), [], msgAuthorId);

        if (!isPrivilegedUser) {
            utils().sendMessage(guildId, channelId, "*Uda dibilang cm owner yg bisa pake command ini...\\nMasihhh aja ngeyell... hmmm*");
            return;
        }

        let hasBeenAdded = false;

        if (msgData.mentions.length == 0) {
            utils().sendMessage(guildId, channelId, '*Mo nambahin siapa mzz... -_-*');
            return;
        }

        const targetId = msgData.mentions[0].id;

        getAdminList().forEach((value) => {
            if (value == targetId) {
                hasBeenAdded = true;
            }
        });

        const u1cb = () => {
            if (hasBeenAdded) {
                utils().sendMessage(guildId, channelId, `*<@${targetId}> udah ada di daftar admin.*`);
                return;
            }

            utils().sendMessage(guildId, channelId, `*Baru nambahin <@${targetId}> ke daftar admin...*`).then((response) => {
                const targetRef = ref(getAppDatabase(), `${ADMINS_PATH}/${targetId}`);
                let targetName = '';

                if (msgDataSplit.length > 3) {
                    msgDataSplit.forEach((value, index) => {
                        if (index > 2) {
                            if (index == (msgDataSplit.length - 1)) {
                                targetName += value;
                            } else {
                                targetName += value + ' ';
                            }
                        }
                    });
                } else {
                    targetName = msgData.mentions[0].username + '#' + msgData.mentions[0].discriminator;
                }

                set(targetRef, { 'name': targetName }).then(() => {
                    utils().editMessage(guildId, channelId, response.data.id, `*Udah kutambahkan <@${targetId}> ke daftar admin ya.*`);
                }).catch(() => {
                    utils().editMessage(guildId, channelId, response.data.id, `*Yahh, gagal masukin <@${targetId}> ke daftar admin nihh.*`);
                });
            });
        }

        utils().handleMentioningMessage(
            msgData,
            utils().emptycb,
            utils().emptycb,
            u1cb
        );
    }
);

const joinThread = new BotCommand(
    'jointhread',
    'Buat masukin anubot ke thread.',
    process.env.CMD_PREFIX + ' jointhread [threadId]',
    ['jt'],
    CommandCategories.hanyaOwner,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu randomquote]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;

        const isPrivilegedUser = utils().isPrivilegedUser(getOwnerList(), getAdminList(), msgData.author.id);

        if (!isPrivilegedUser) {
            utils().sendMessage(guildId, channelId, '*Ishh, kamu bukan owner/admin, aku gamau join thread.*');
            return;
        }

        const msgDataSplit = msgData.content.splitByWhitespace();

        if (msgDataSplit.length > 2) {
            const threadId = msgDataSplit[2];
            utils().joinThread(guildId, channelId, threadId).then(() => {
                utils().sendMessage(guildId, channelId, '*Okzz, aku uda join threadnya.*');
            }).catch((err) => {
                utils().sendMessage(guildId, channelId, '*Yahh, aku gagal join threadnya.*\\n*Nih kode errornya: ' + err.status + '*');
            });
        } else {
            utils().sendMessage(guildId, channelId, '*Ishh, mau join thread mana?! Kasih thread id nya donggg!!*');
        }
    }
);

module.exports = [addAdmin, joinThread];
