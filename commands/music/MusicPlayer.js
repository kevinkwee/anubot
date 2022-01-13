const {
    createAudioPlayer,
    entersState,
    VoiceConnection,
    VoiceConnectionStatus,
    VoiceConnectionDisconnectReason,
    AudioPlayerStatus
} = require('@discordjs/voice');

const { promisify } = require('node:util');
const { setGuildMusicPlayer } = require('./bot-data');

const utils = require('../../utils/utils');
const Track = require('./Track');

const wait = promisify(setTimeout);

class LoopMode {
    static OFF = 'off';
    static TRACK = 'track';
    static QUEUE = 'queue';
}

class ShuffleMode {
    static OFF = 'off';
    static ON = 'on';
}

class MusicPlayer {
    /**
     * @type {VoiceConnection}
     */
    voiceConnection;
    audioPlayer;
    queue;
    queueLock = false;
    readyLock = false;
    lastPlayerMessageId;
    boundGuildId;
    boundTextChannelId;
    isLeaving = false;
    loopMode;
    shuffleMode;

    /**
     * 
     * @param {VoiceConnection} voiceConnection 
     * @param {String} boundGuildId 
     * @param {String} boundTextChannelId 
     */
    constructor(voiceConnection, boundGuildId, boundTextChannelId) {
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.queue = [];
        this.loopMode = LoopMode.OFF;
        this.shuffleMode = ShuffleMode.OFF;
        this.boundGuildId = boundGuildId;
        this.boundTextChannelId = boundTextChannelId;

        this.voiceConnection.on('stateChange', async (_, newState) => {
            if (newState.status == VoiceConnectionStatus.Disconnected) {
                if (newState.reason == VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode == 4014) {
                    try {
                        await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5e3);
                    } catch {
                        this.voiceConnection.destroy();
                    }
                } else if (this.voiceConnection.rejoinAttempts < 5) {
                    await wait((this.voiceConnection.rejoinAttempts + 1) * 5e3);
                    this.voiceConnection.rejoin();
                } else {
                    this.voiceConnection.destroy();
                }
            } else if (newState.status == VoiceConnectionStatus.Destroyed) {
                this.stop();
                setGuildMusicPlayer(this.boundGuildId, null);
            } else if (
                !this.readyLock &&
                (newState.status == VoiceConnectionStatus.Connecting || newState.status == VoiceConnectionStatus.Signalling)
            ) {
                this.readyLock = true;
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 10e3);
                    const embeds = [
                        {
                            "color": 10717951,
                            "description": `Anu udah join <#${this.voiceConnection.joinConfig.channelId}> nihh. :relaxed:\nAnu bakal kirim info di <#${this.boundTextChannelId}> yaa. :call_me:`,
                            "timestamp": (new Date()).toISOString(),
                        }
                    ];
                    utils.sendMessage(this.boundGuildId, this.boundTextChannelId, '', embeds);
                    this.voiceConnection.subscribe(this.audioPlayer);
                } catch (error) {
                    if (this.voiceConnection.state.status != VoiceConnectionStatus.Destroyed) {
                        this.voiceConnection.destroy();
                    }
                } finally {
                    this.readyLock = false;
                }
            }
        });

        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if (oldState.status != AudioPlayerStatus.Idle && newState.status == AudioPlayerStatus.Idle) {
                this.onFinish();
                this.processQueue();
            } else if (oldState.status != AudioPlayerStatus.AutoPaused && newState.status == AudioPlayerStatus.Playing) {
                this.onStart(newState.resource.metadata);
            }
        });

        this.audioPlayer.on('error', (error) => {
            this.onError(error, error.resource.metadata);
        });

    }

    /**
     * @private
     */
    lockQueue() {
        this.queueLock = true;
    }

    /**
     * @private
     */
    unlockQueue() {
        this.queueLock = false;
    }

    /**
     * @param {Track} track 
     */
    enqueue(track, guildId, channelId, loadingMsgId) {
        if (this.queueLock) {
            // Wrap recursive bcoz of max stack call size.
            setImmediate(() => {
                this.enqueue(track, guildId, channelId, loadingMsgId);
            });
            return;
        }

        this.lockQueue();
        this.queue.push(track);
        this.unlockQueue();
        const embeds = [
            {
                "color": 10717951,
                "description": `:dvd: Yeay, kuberhasil masukin lagu \`${track.title}\` ke playlist. Durasi lagunya \`${utils.getDuration(track.durationInSec)}\`.`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.editMessage(guildId, channelId, loadingMsgId, '', embeds);
        this.processQueue();
    }

    enqueuePlaylist({
        fulfilledTracks,
        guildId,
        channelId,
        loadingMsgId,
        rejectedTrackCount,
        playlistName
    }) {
        if (this.queueLock) {
            // Wrap recursive bcoz of max stack call size.
            setImmediate(() => {
                this.enqueuePlaylist(fulfilledTracks);
            });
            return;
        }

        this.lockQueue();
        this.queue.push(...fulfilledTracks);
        this.unlockQueue();

        let description = '';
        let durationInSec = 0
        fulfilledTracks.forEach((track) => {
            durationInSec += track.durationInSec;
        });

        if (rejectedTrackCount == 0) {
            description = `:dvd: Yeay, kuberhasil masukin \`${fulfilledTracks.length} lagu\` dari playlist \`${playlistName}\`. Durasi totalnya \`${utils.getDuration(durationInSec)}\`.`;
        } else {
            description = `:dvd: Yahh, kuhanya bisa masukin \`${fulfilledTracks.length} lagu\` dari playlist \`${playlistName}\`. Ada ${rejectedTrackCount} lagu yang eror. :sob: Jadi durasi totalnya tinggal \`${utils.getDuration(durationInSec)}\`.`;
        }

        const embeds = [
            {
                "color": 10717951,
                "description": description,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.editMessage(guildId, channelId, loadingMsgId, '', embeds);
        this.processQueue();
    }

    /**
     * @param {String} userId Id of the user who skip the song.
     */
    skip(guildId, channelId, userId) {
        if (this.queueLock) {
            // Wrap recursive bcoz of max stack call size.
            setImmediate(() => {
                this.skip(guildId, channelId, userId);
            });
            return;
        }

        this.lockQueue();

        if (this.queue.length == 0 && this.audioPlayer.state.status == AudioPlayerStatus.Idle) {
            this.unlockQueue();
            const embeds = [
                {
                    "color": 16711680,
                    "description": `:x: Playlistnya uda kosong <@${userId}>, apa yg mau diskip cobaa...`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }

        const embeds = [
            {
                "color": 10717951,
                "description": `:track_next: Okay <@${userId}>, lagunya aku skip yaa.`,
                "timestamp": (new Date()).toISOString(),
            }
        ];

        utils.sendMessage(guildId, channelId, '', embeds);

        if (this.queue.length == 0) {
            this.unlockQueue();
            this.stop();
        }

        this.unlockQueue();
        this.processQueue(true);
    }

    stop() {
        if (this.queueLock) {
            // Wrap recursive bcoz of max stack call size.
            setImmediate(() => {
                this.stop();
            });
            return;
        }

        this.lockQueue();
        this.queue = [];
        this.audioPlayer.stop(true);
        this.unlockQueue();
    }

    clear(guildId, channelId) {
        if (this.audioPlayer.state.status != AudioPlayerStatus.Playing && this.queue.length == 0) {
            const embeds = [
                {
                    "color": 16711680,
                    "description": `:x: Mz sadar mz, playlist uda bersih, pun ga da lagu yang baru diputar...`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }

        this.stop();
        const embeds = [
            {
                "color": 10717951,
                "description": `:stop_button: Ok mz, udah kuhapus semua kenangan masa lalumu... Ehh, ngga, maksudnya playlist lagunya. :sweat_smile:`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(guildId, channelId, '', embeds);
    }

    leave(guildId, channelId) {
        this.isLeaving = true;
        this.voiceConnection.destroy();
        const embeds = [
            {
                "color": 10717951,
                "description": `Dadaahh et <#${this.voiceConnection.joinConfig.channelId}>. Anu pergi yaaa... :wave:`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(guildId, channelId, '', embeds);
    }

    loopTrack(guildId, channelId) {
        if (this.queueLock) {
            // Wrap recursive bcoz of max stack call size.
            setImmediate(() => {
                this.loopTrack(guildId, channelId);
            });
            return;
        }

        if (this.audioPlayer.state.status != AudioPlayerStatus.Playing) {
            const embeds = [
                {
                    "color": 16711680,
                    "description": `:x: Ngga ada lagu yang diputer mz, apa yang mo diulang...`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }

        if (this.loopMode == LoopMode.TRACK) {
            const embeds = [
                {
                    "color": 16711680,
                    "description": `:x: Lagu yang sekarang dimainkan uda di mode ulang mz...`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }

        this.lockQueue();
        this.loopMode = LoopMode.TRACK;
        /**
         * @type {Track}
         */
        const currentTrack = this.audioPlayer.state.resource.metadata;
        if (currentTrack != this.queue[0]) {
            this.queue.unshift(currentTrack);
        }
        this.unlockQueue();

        const embeds = [
            {
                "color": 10717951,
                "description": `:repeat_one: Lagu \`${currentTrack.title}\` bakal kuulang-ulang ya mz.`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(guildId, channelId, '', embeds);
    }

    loopQueue(guildId, channelId) {
        if (this.queueLock) {
            // Wrap recursive bcoz of max stack call size.
            setImmediate(() => {
                this.loopQueue(guildId, channelId);
            });
            return;
        }

        this.lockQueue();

        if (this.queue.length == 0 && this.audioPlayer.state.status == AudioPlayerStatus.Idle) {
            this.unlockQueue();
            const embeds = [
                {
                    "color": 16711680,
                    "description": `:x: Playlistnya kosong mz, apa yang mo diulang coba...`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }

        if (this.loopMode == LoopMode.QUEUE) {
            this.unlockQueue();
            const embeds = [
                {
                    "color": 16711680,
                    "description": `:x: Mode ulang playlist uda hidup mz.`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }

        if (this.loopMode == LoopMode.TRACK) {
            if (this.queue.length > 1) {
                const firstTrack = this.queue.shift();
                if (firstTrack != this.queue[this.queue.length - 1]) {
                    this.queue.push(firstTrack);
                }
            }
        }

        const nowPlaying = this.audioPlayer.state.resource.metadata;

        if (nowPlaying != this.queue[this.queue.length - 1]) {
            this.queue.push(nowPlaying);
        }

        this.unlockQueue();

        this.loopMode = LoopMode.QUEUE;
        const embeds = [
            {
                "color": 10717951,
                "description": `:repeat: Okay, playlistnya bakal aku ulang-ulang ya.`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(guildId, channelId, '', embeds);
    }

    loopOff(guildId, channelId) {
        switch (this.loopMode) {
            case LoopMode.TRACK:
                if (this.queueLock) {
                    // Wrap recursive bcoz of max stack call size.
                    setImmediate(() => {
                        this.loopOff(guildId, channelId);
                    });
                    return;
                }
                this.lockQueue();
                this.queue.shift();
                this.unlockQueue();
                break;
            case LoopMode.OFF:
                const embeds = [
                    {
                        "color": 16711680,
                        "description": `:x: Mode ulang ga nyala mz dari tadi...`,
                        "timestamp": (new Date()).toISOString(),
                    }
                ];
                utils.sendMessage(guildId, channelId, '', embeds);
                return;
        }

        this.lockQueue();

        const nowPlaying = this.audioPlayer.state.resource.metadata;

        if (nowPlaying == this.queue[this.queue.length - 1]) {
            this.queue.pop();
        }

        this.unlockQueue();

        this.loopMode = LoopMode.OFF;
        const embeds = [
            {
                "color": 10717951,
                "description": `:negative_squared_cross_mark: Okay, mode ulang aku matiin yaa.`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(guildId, channelId, '', embeds);
    }

    shuffleOn(guildId, channelId) {
        if (this.shuffleMode == ShuffleMode.ON) {
            const embeds = [
                {
                    "color": 16711680,
                    "description": `:x: Ishh, mode acak udah hidup lhoo... :unamused:`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }
        this.shuffleMode = ShuffleMode.ON;
        const embeds = [
            {
                "color": 10717951,
                "description": `:twisted_rightwards_arrows: Ok mz, urutan lagunya kuacak-acak ya. Tapi jangan acak2 hidup ya xixi. :hugging:`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(guildId, channelId, '', embeds);
    }

    shuffleOff(guildId, channelId) {
        if (this.shuffleMode == ShuffleMode.OFF) {
            const embeds = [
                {
                    "color": 16711680,
                    "description": `:x: Ishh, mode acak udah ga nyala lhoo... :unamused:`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];
            utils.sendMessage(guildId, channelId, '', embeds);
            return;
        }
        this.shuffleMode = ShuffleMode.OFF;
        const embeds = [
            {
                "color": 10717951,
                "description": `:negative_squared_cross_mark: Ok mz, urutan lagunya udah ngga acak lagi ya.`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(guildId, channelId, '', embeds);
    }

    /**
     * @private
     * @returns void
     */
    async processQueue(isSkipping = false) {
        if ((this.audioPlayer.state.status != AudioPlayerStatus.Idle && !isSkipping) || this.queue.length == 0) {
            if (this.queueLock) {
                // Wrap recursive bcoz of max stack call size.
                setImmediate(() => {
                    this.processQueue(isSkipping);
                });
                return;
            }
            return;
        }

        this.lockQueue();

        /**
         * @type {Track}
         */
        let nextTrack;

        if (this.loopMode == LoopMode.TRACK) {
            if (isSkipping) {
                if (this.queue.length < 2) {
                    this.unlockQueue();
                    this.stop();
                    return;
                }
                if (this.shuffleMode == ShuffleMode.ON) {
                    const randomIndex = Math.floor(Math.random() * this.queue.length);
                    this.queue = this.queue.filter((track, index) => {
                        if (index == randomIndex) {
                            nextTrack = track;
                        } else {
                            return track;
                        }
                    });
                    this.queue.unshift(nextTrack);
                } else {
                    this.queue.shift();
                    nextTrack = this.queue[0];
                }
            } else {
                nextTrack = this.queue[0];
            }
        } else {
            if (this.shuffleMode == ShuffleMode.ON) {
                const randomIndex = Math.floor(Math.random() * this.queue.length);
                this.queue = this.queue.filter((track, index) => {
                    if (index == randomIndex) {
                        nextTrack = track;
                    } else {
                        return track;
                    }
                });
            } else {
                nextTrack = this.queue.shift();
            }

            if (this.loopMode == LoopMode.QUEUE) {
                this.queue.push(nextTrack);
            }
        }

        try {
            const resource = await nextTrack.createAudioResource();
            this.audioPlayer.play(resource);
            this.unlockQueue();
        } catch (error) {
            this.onError(error, nextTrack);
            this.unlockQueue();
            return this.processQueue();
        }
    }

    /**
     * @private
     * @param {Track} audioResourceMetadata
     */
    async onStart(audioResourceMetadata) {
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
                        "value": `\`${utils.getDuration(audioResourceMetadata.durationInSec)}\``,
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
        utils.sendMessage(this.boundGuildId, this.boundTextChannelId, '', embeds).then((response) => {
            this.lastPlayerMessageId = response.data.id;
        });
    }

    /**
     * @private
     */
    onFinish() {
        if (this.lastPlayerMessageId) {
            utils.deleteMessage(this.boundGuildId, this.boundTextChannelId, this.lastPlayerMessageId);
            this.lastPlayerMessageId = null;
        }

        if (!this.queue[0] && !this.isLeaving) {
            const embeds = [
                {
                    "color": 10717951,
                    "description": `:eject: Playlistnya uda habis mz.`,
                    "timestamp": (new Date()).toISOString(),
                }
            ];

            utils.sendMessage(this.boundGuildId, this.boundTextChannelId, '', embeds);
        }
    }

    /**
     * @private
     * @param {Error} error 
     * @param {Track} audioResourceMetadata
     */
    onError(error, audioResourceMetadata) {
        console.log('[' + utils.getCurrentTimeStr() + '] ERROR WHEN PLAYING ' + audioResourceMetadata.title);
        console.error(error);
        const content = `:x: Duhh, ada eror pas muter \`${audioResourceMetadata.title}\` nihh.`;
        const embeds = [
            {
                "color": 16711680,
                "description": content,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(this.boundGuildId, this.boundTextChannelId, '', embeds);
    }

    onAlone() {
        this.voiceConnection.destroy();
        const embeds = [
            {
                "color": 10717951,
                "description": `Ishh aku ditinggal sendiri :unamused:\nDahlah, aku juga keluar dari <#${this.voiceConnection.joinConfig.channelId}>.`,
                "timestamp": (new Date()).toISOString(),
            }
        ];
        utils.sendMessage(this.boundGuildId, this.boundTextChannelId, '', embeds);
    }
}

module.exports = { MusicPlayer, ShuffleMode, LoopMode };
