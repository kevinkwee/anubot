const {
    BotCommand,
    CommandCategories
} = require('../BotCommand.js');

const {
    getUserCurrentVoiceChannelId
} = require('./guild-data');

const {
    joinVoiceChannel, AudioPlayerStatus
} = require('@discordjs/voice');

const {
    createBotAdapter
} = require('../../voice/adapter');

const {
    getGuildMusicPlayer,
    setGuildMusicPlayer
} = require('./bot-data');

const playdl = require('play-dl');
const utils = require('../../utils/utils');
const Track = require('./Track');
const { MusicPlayer, ShuffleMode, LoopMode } = require('./MusicPlayer.js');
const MusicMessage = require('./MusicMessage');

function isTheUserCurrentlyOnAVoiceChannel(guildId, channelId, userId) {
    const userCurrentVoiceChannelId = getUserCurrentVoiceChannelId(guildId, userId);
    if (!userCurrentVoiceChannelId) {
        utils.sendMessage(guildId, channelId, MusicMessage.KAMU_NGGAK_DI_VC);
        return false;
    }
    return userCurrentVoiceChannelId;
}

/**
 * @param {String} guildId 
 * @param {String} channelId 
 * @param {{msgIfTrue: String, msgIfFalse: String}} msg
 * @returns {MusicPlayer | false} Return MusicPlayer if true. Otherwise, return false.
 */
function isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, msg = {}) {
    const guildMusicPlayer = getGuildMusicPlayer(guildId);

    if (guildMusicPlayer) {
        if (msg.msgIfTrue) {
            utils.sendMessage(guildId, channelId, msg.msgIfTrue);
        }
        return guildMusicPlayer;
    }

    if (msg.msgIfFalse) {
        utils.sendMessage(guildId, channelId, msg.msgIfFalse);
    }

    return false;
}

/**
 * ONLY RUN THIS FUNCTION IF THE BOT IS CURRENTLY ON A VOICE CHANNEL
 * @param {String} guildId 
 * @param {String} channelId 
 * @param {String} userId 
 * @returns 
 */
function isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, userId, msgIfFalse = MusicMessage.KAMU_NGGAK_SE_VC) {
    const userCurrentVoiceChannelId = getUserCurrentVoiceChannelId(guildId, userId);
    const guildMusicPlayer = getGuildMusicPlayer(guildId);

    if (!guildMusicPlayer) {
        throw Error('You must run this function only if the bot is currently on a voice channel.');
    }

    if (userCurrentVoiceChannelId != guildMusicPlayer.voiceConnection.joinConfig.channelId) {
        utils.sendMessage(guildId, channelId, msgIfFalse);
        return false;
    }

    return true;
}

const gabung = new BotCommand(
    'gabung',
    'Buat ngajak anu masuk ke vc.',
    process.env.CMD_PREFIX + ' gabung',
    ['g', 'j', 'join'],
    CommandCategories.music,
    async (msgData, ws) => {
        console.log();
        console.log("[Command detected] [anu join]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgAuthorId = msgData.author.id;
        const userCurrentVoiceChannelId = getUserCurrentVoiceChannelId(guildId, msgAuthorId);

        if (!isTheUserCurrentlyOnAVoiceChannel(guildId, channelId, msgAuthorId)) return;
        if (isTheBotCurrentlyOnAVoiceChannel(guildId, channelId)) {
            if (!isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, msgAuthorId, MusicMessage.UDAH_SAMA_YANG_LAIN)) return;

            utils.sendMessage(guildId, channelId, MusicMessage.UDAH_GABUNG_LOH);
            return;
        }

        const musicPlayer = new MusicPlayer(
            joinVoiceChannel({
                channelId: userCurrentVoiceChannelId,
                guildId: guildId,
                adapterCreator: createBotAdapter(ws)
            }),
            guildId,
            channelId
        );

        setGuildMusicPlayer(guildId, musicPlayer);
    },
);

const pergi = new BotCommand(
    'pergi',
    'Buat minta anu keluar dari vc.',
    process.env.CMD_PREFIX + ' pergi',
    ['pg', 'leave', 'l', 'stop'],
    CommandCategories.music,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu pergi]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, { msgIfFalse: MusicMessage.PFT });

        if (!guildMusicPlayer) return;

        if (!isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, msgData.author.id)) return;

        guildMusicPlayer.leave(guildId, channelId);
    }
);

const putar = new BotCommand(
    'putar',
    'Buat minta anu muter lagu. Bisa Spotify, Youtube, sm Soundcloud.',
    process.env.CMD_PREFIX + ' putar [url/kata kunci pencarian]',
    ['p', 'play'],
    CommandCategories.music,
    async (msgData, ws) => {
        console.log();
        console.log("[Command detected] [anu putar]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgAuthorId = msgData.author.id;
        /**
         * @type {MusicPlayer | false}
         */
        let guildMusicPlayer;

        const userCurrentVoiceChannelId = isTheUserCurrentlyOnAVoiceChannel(guildId, channelId, msgAuthorId);
        if (!userCurrentVoiceChannelId) return;
        guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId);

        if (!guildMusicPlayer) {
            guildMusicPlayer = new MusicPlayer(
                joinVoiceChannel({
                    channelId: userCurrentVoiceChannelId,
                    guildId: guildId,
                    adapterCreator: createBotAdapter(ws)
                }),
                guildId,
                channelId
            );

            setGuildMusicPlayer(guildId, guildMusicPlayer);
        }

        if (!isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, msgAuthorId, MusicMessage.UDAH_SAMA_YANG_LAIN)) return;

        /**
         * @type {String[]}
         */
        const msgContentSplit = msgData.content.splitByWhitespace();

        if (msgContentSplit.length < 3) {
            utils.sendMessage(guildId, channelId, '> *Mau dengerin lagu apa mz.. Kasih link ato kata kuncinya lahh.*');
            return;
        }

        let arg = '';

        if (msgContentSplit.length > 3) {
            // search argument
            msgContentSplit.forEach((value, index) => {
                if (index > 1) {
                    if (index == (msgContentSplit.length - 1)) {
                        arg += value;
                        return;
                    }
                    arg += value + ' ';
                }
            });
        } else {
            // url
            arg = msgContentSplit[2];
        }

        const loadingMsgResponse = await utils.sendMessage(guildId, channelId, '> *Bentar ya mzz...*');

        const processUnresolvedList = async (unresolvedList) => {
            const promisedList = await Promise.allSettled(unresolvedList);
            let fulfilledList = [];
            let rejectedItemCount = 0;
            promisedList.forEach((promisedItem) => {
                if (promisedItem.status == "fulfilled") {
                    fulfilledList.push(promisedItem.value);
                } else {
                    rejectedItemCount++;
                }
            });
            return { fulfilledList, rejectedItemCount };
        };

        try {
            const validateResult = await playdl.validate(arg);
            switch (validateResult) {
                case "so_playlist":
                    var tracks = [];
                    /**
                     * @type {playdl.SoundCloudPlaylist}
                     */
                    let so_playlist = await playdl.soundcloud(arg);
                    so_playlist = await so_playlist.fetch();
                    so_playlist.tracks.forEach((so_track) => {
                        const track = Track.fromSoundcloud(so_track, msgAuthorId);
                        tracks.push(track);
                    });

                    var {
                        fulfilledList: fulfilledTracks,
                        rejectedItemCount: rejectedTrackCount
                    } = await processUnresolvedList(tracks);

                    guildMusicPlayer.enqueuePlaylist({
                        fulfilledTracks: fulfilledTracks,
                        guildId: guildId,
                        channelId: channelId,
                        loadingMsgId: loadingMsgResponse.data.id,
                        rejectedTrackCount: rejectedTrackCount,
                        playlistName: so_playlist.name
                    });
                    break;
                case "so_track":
                    var track = await Track.fromSoundcloud(arg, msgAuthorId);
                    guildMusicPlayer.enqueue(track, guildId, channelId, loadingMsgResponse.data.id);
                    break;
                case "yt_playlist":
                    var tracks = [];
                    let yt_playlist = await playdl.playlist_info(arg);
                    const all_videos = await yt_playlist.all_videos();
                    all_videos.forEach((video) => {
                        const track = Track.fromYoutube(video, msgAuthorId);
                        tracks.push(track);
                    });
                    var {
                        fulfilledList: fulfilledTracks,
                        rejectedItemCount: rejectedTrackCount
                    } = await processUnresolvedList(tracks);

                    guildMusicPlayer.enqueuePlaylist({
                        fulfilledTracks: fulfilledTracks,
                        guildId: guildId,
                        channelId: channelId,
                        loadingMsgId: loadingMsgResponse.data.id,
                        rejectedTrackCount: rejectedTrackCount,
                        playlistName: yt_playlist.title
                    });
                    break;
                case "yt_video":
                    var track = await Track.fromYoutube(arg, msgAuthorId);
                    guildMusicPlayer.enqueue(track, guildId, channelId, loadingMsgResponse.data.id);
                    break;
                case "search":
                    var yt_videos = await playdl.search(arg, {
                        source: { youtube: 'video' },
                        limit: 1
                    });
                    var track = await Track.fromYoutube(yt_videos[0], msgAuthorId);
                    guildMusicPlayer.enqueue(track, guildId, channelId, loadingMsgResponse.data.id);
                    break;
                case "sp_album":
                case "sp_playlist":
                    if (playdl.is_expired()) {
                        await playdl.refreshToken();
                    }
                    let sp_playlist = await playdl.spotify(arg);
                    const all_tracks = await sp_playlist.all_tracks();
                    var unresolvedSearchResults = [];
                    all_tracks.forEach((sp_track) => {
                        let artists = '';
                        sp_track.artists.forEach((artist) => {
                            artists += artist.name + ' ';
                        });
                        const searchKeyword = `${artists}${sp_track.name}`;
                        unresolvedSearchResults.push(playdl.search(searchKeyword, {
                            source: { youtube: 'video' },
                            limit: 1
                        }));
                    });
                    var { fulfilledList: fulfilledSearchResults } = await processUnresolvedList(unresolvedSearchResults);
                    var yt_videos = [];
                    fulfilledSearchResults.forEach((fulfilledSearchResults) => {
                        yt_videos.push(...fulfilledSearchResults);
                    });
                    var tracks = [];
                    yt_videos.forEach((yt_video) => {
                        const track = Track.fromYoutube(yt_video, msgAuthorId);
                        tracks.push(track);
                    });
                    var { fulfilledList: fulfilledTracks } = await processUnresolvedList(tracks);
                    guildMusicPlayer.enqueuePlaylist({
                        fulfilledTracks: fulfilledTracks,
                        guildId: guildId,
                        channelId: channelId,
                        loadingMsgId: loadingMsgResponse.data.id,
                        rejectedTrackCount: (sp_playlist.tracksCount - fulfilledTracks.length),
                        playlistName: sp_playlist.name
                    });
                    break;
                case "sp_track":
                    var sp_track = await playdl.spotify(arg);
                    var artists = '';
                    sp_track.artists.forEach((artist) => {
                        artists += artist.name + ' ';
                    });
                    var searchKeyword = `${artists}${sp_track.name}`;
                    var yt_videos = await playdl.search(searchKeyword, {
                        source: { youtube: 'video' },
                        limit: 1
                    });
                    var track = await Track.fromYoutube(yt_videos[0], msgAuthorId);
                    guildMusicPlayer.enqueue(track, guildId, channelId, loadingMsgResponse.data.id);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(error);
            utils.editMessage(guildId, channelId, loadingMsgResponse.data.id, `> *Duhh, maaf ya mz, kliatannya ada eror pas aku buka urlnya. :sob:*`);
        }
    },
);

const skip = new BotCommand(
    'skip',
    'Buat skip lagu di playlist.',
    process.env.CMD_PREFIX + ' skip',
    ['s'],
    CommandCategories.music,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu skip]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgAuthorId = msgData.author.id;
        const guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, { msgIfFalse: MusicMessage.PFT });

        if (!guildMusicPlayer) return;
        if (!isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, msgAuthorId)) return;
        guildMusicPlayer.skip(guildId, channelId, msgAuthorId);
    },
);

const antrean = new BotCommand(
    'antrean',
    'Buat lihat daftar antrean lagu.',
    process.env.CMD_PREFIX + ' antrean [halaman]',
    ['a', 'queue', 'q'],
    CommandCategories.music,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu antrean]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgContentSplit = msgData.content.splitByWhitespace();
        const guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, { msgIfFalse: MusicMessage.PFT });

        if (!guildMusicPlayer) return;

        const trackCount = guildMusicPlayer.queue.length;
        const pageCount = Math.ceil(trackCount / 10);

        let fields = [
            {
                "name": "Baru diputar",
                "value": '-',
                "inline": false
            },
            {
                "name": "Durasi total",
                "value": ``,
                "inline": false
            },
            {
                "name": "Mode acak",
                "value": ``,
                "inline": true
            },
            {
                "name": "Mode ulang",
                "value": ``,
                "inline": true
            }
        ];

        let durationInSec = 0;

        guildMusicPlayer.queue.forEach((track) => {
            durationInSec += track.durationInSec;
        });

        fields[1].value = `\`${utils.getDuration(durationInSec)}\``;

        if (guildMusicPlayer.shuffleMode == ShuffleMode.ON) {
            fields[2].value = ':twisted_rightwards_arrows: Hidup';
        } else {
            fields[2].value = ':regional_indicator_x: Mati';
        }

        switch (guildMusicPlayer.loopMode) {
            case LoopMode.TRACK:
                fields[3].value = ':repeat_one: Satu lagu';
                break;
            case LoopMode.QUEUE:
                fields[3].value = ':repeat: Antrean';
                break;
            default:
                fields[3].value = ':regional_indicator_x: Mati';
                break;
        }

        if (guildMusicPlayer.audioPlayer.state.status == AudioPlayerStatus.Playing) {
            const track = guildMusicPlayer.audioPlayer.state.resource.metadata;
            fields[0].value = `[${track.title}](${track.url})`;
        }

        if (trackCount == 0) {
            const embeds = [
                {
                    "title": "Daftar Antrean Anu",
                    "color": 10717951,
                    "description": "*K O S O N G*",
                    "timestamp": (new Date()).toISOString(),
                    "fields": fields,
                    "footer": {
                        "text": "Seperti hatimu!"
                    }
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }

        let songList = '';
        let requestedPage = NaN;

        if (msgContentSplit.length > 2) {
            requestedPage = parseInt(msgContentSplit[2]);
        }

        if (isNaN(requestedPage) || requestedPage > pageCount) {
            requestedPage = 1;
        }

        const startIndex = 10 * requestedPage - 10;
        const endIndex = 10 * requestedPage - 1;

        guildMusicPlayer.queue.forEach((track, index) => {
            if (index < startIndex || index > endIndex) return;
            songList += `${index + 1}. [${track.title}](${track.url})\n`;
        });

        songList = songList.slice(0, -1);

        const embeds = [
            {
                "title": "Daftar Antrean Anu",
                "color": 10717951,
                "description": songList,
                "timestamp": (new Date()).toISOString(),
                "footer": {
                    "text": `Halaman ${requestedPage} dari ${pageCount}`
                },
                "fields": fields
            }
        ];

        utils.sendMessage(guildId, channelId, '', embeds);
    },
);

const ulang = new BotCommand(
    'ulang',
    'Buat ngulang-ngulang lagu atau playlist',
    process.env.CMD_PREFIX + ' ulang [mati/off/lagu/song/track/t/one/a/antrean/playlist/all/queue/q]',
    ['u', 'loop', 'repeat', 'r'],
    CommandCategories.music,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu antrean]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgContentSplit = msgData.content.splitByWhitespace();
        const guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, { msgIfFalse: MusicMessage.PFT });

        if (!guildMusicPlayer) return;
        if (!isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, msgData.author.id)) return;

        let loopMode;

        if (msgContentSplit.length > 2) {
            loopMode = msgContentSplit[2];
        }

        switch (loopMode) {
            case 'antrean':
            case 'playlist':
            case 'all':
            case 'a':
            case 'queue':
            case 'q':
                guildMusicPlayer.loopQueue(guildId, channelId);
                break;
            case 'off':
            case 'mati':
                guildMusicPlayer.loopOff(guildId, channelId);
                break;
            default:
                guildMusicPlayer.loopTrack(guildId, channelId);
                break;
        }
    }
);

const bersihkan = new BotCommand(
    'bersihkan',
    'Buat hapus semua kenangan masa lalumu... Ehh, ngga, mksdnya semua antrean lagu. xixixi',
    process.env.CMD_PREFIX + ' bersihkan',
    ['clear', 'reset'],
    CommandCategories.music,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu antrean]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, { msgIfFalse: MusicMessage.PFT });

        if (!guildMusicPlayer) return;
        if (!isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, msgData.author.id)) return;
        guildMusicPlayer.clear(guildId, channelId);
    }
);

const acak = new BotCommand(
    'acak',
    'Buat ngacak-acak urutan lagu.',
    process.env.CMD_PREFIX + ' acak [mati/off]',
    ['shuffle', 'random', 'mix'],
    CommandCategories.music,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu antrean]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgContentSplit = msgData.content.splitByWhitespace();
        const guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, { msgIfFalse: MusicMessage.PFT });

        if (!guildMusicPlayer) return;
        if (!isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, msgData.author.id)) return;

        if (msgContentSplit.length >= 3) {
            if (msgContentSplit[2] == 'mati' || msgContentSplit[2] == 'off') {
                guildMusicPlayer.shuffleOff(guildId, channelId);
                return;
            }
        }
        guildMusicPlayer.shuffleOn(guildId, channelId);
    }
);

const barudiputar = new BotCommand(
    'barudiputar',
    'Buat lihat lagu yang baru diputar.',
    process.env.CMD_PREFIX + ' barudiputar',
    ['bd', 'sekarang', 'now', 'nowplaying', 'np'],
    CommandCategories.music,
    (msgData) => {
        console.log();
        console.log("[Command detected] [anu antrean]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, { msgIfFalse: MusicMessage.PFT });

        if (!guildMusicPlayer) return;
        if (guildMusicPlayer.audioPlayer.state.status != AudioPlayerStatus.Playing) {
            const embeds = [
                {
                    "color": 10717951,
                    "description": `:stop_button: Ngga ada lagu yang baru kuputar mz.`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }
        const audioResourceMetadata = guildMusicPlayer.audioPlayer.state.resource.metadata;
        const embeds = [
            {
                "title": "Anu Baru Muter Lagu",
                "color": 10717951,
                "description": `[${audioResourceMetadata.title}](${audioResourceMetadata.url})`,
                "thumbnail": {
                    "url": audioResourceMetadata.thumbnailUrl
                },
                "footer": {
                    "text": "Selamat mendengarkan!"
                },
                "timestamp": `${(new Date()).toISOString()}`,
                "fields": [
                    {
                        "name": "Durasi",
                        "value": `\`${utils.getDuration(Math.floor(guildMusicPlayer.audioPlayer.state.resource.playbackDuration / 1e3))}/${utils.getDuration(audioResourceMetadata.durationInSec)}\``,
                        "inline": true
                    },
                    {
                        "name": "Pengunggah",
                        "value": `[${audioResourceMetadata.uploader}](${audioResourceMetadata.uploaderUrl})`,
                        "inline": true
                    },
                    {
                        "name": "Yang minta",
                        "value": `<@${audioResourceMetadata.requesterId}>`,
                        "inline": true
                    }
                ]
            }
        ];
        utils.sendMessage(guildId, channelId, '', embeds);
    }
);

const hapus = new BotCommand(
    'hapus',
    'Buat hapus lagu yang km mau.',
    process.env.CMD_PREFIX + ' hapus <nomor lagu di antrean>',
    ['remove', 'delete', 'rm', 'del'],
    CommandCategories.music,
    (msgData, ws) => {
        console.log();
        console.log("[Command detected] [anu hapus]");

        const guildId = msgData.guild_id;
        const channelId = msgData.channel_id;
        const msgContentSplit = msgData.content.splitByWhitespace();
        const guildMusicPlayer = isTheBotCurrentlyOnAVoiceChannel(guildId, channelId, { msgIfFalse: MusicMessage.PFT });

        if (!guildMusicPlayer) return;
        if (!isTheUserCurrentlyOnTheSameVoiceChannel(guildId, channelId, msgData.author.id)) return;

        const selectedTrackNum = parseInt(msgContentSplit[2]);

        if (msgContentSplit.length < 3 || isNaN(selectedTrackNum)) {
            utils.sendMessage(guildId, channelId, '> *Kasih nomor lagu yang mau dihapus ya mz, ku tak bisa membaca pikiranmu.*');
            return;
        }

        guildMusicPlayer.remove(selectedTrackNum - 1, guildId, channelId);
    }
);

module.exports = [gabung, pergi, putar, skip, antrean, ulang, bersihkan, acak, barudiputar, hapus];

/**
 * join V
 * pergi V
 * putar V
 * jeda
 * skip V
 * clear V
 * ulang V
 *
 */
