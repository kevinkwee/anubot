String.prototype.splitByWhitespace = function () {
    return this.split(/\s+/g);
};

require('dotenv').config();
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL
};

initializeApp(firebaseConfig);

const WebSocket = require('ws');
const ScriptLoader = require('./ScriptLoader.js');

const { exit } = require("process");
const {
    addGuildVoiceStateEntry,
    setBotCurrentVoiceChannelId,
    getBotVoiceChannelMemberCount,
    recountBotVoiceChannelMember,
    getBotCurrentVoiceChannelId,
    getGuildVoiceState
} = require('./commands/music/guild-data.js');

const fs = require('fs');
const { getGuildMusicPlayer } = require('./commands/music/bot-data.js');

const utilsLoader = new ScriptLoader('./utils/utils.js');
const utils = () => { return utilsLoader.script };

const commandHandlerLoader = new ScriptLoader('./commands/command-handler.js');
const commandHandler = () => { return commandHandlerLoader.script };

let interval = 0;
let sequence = null;
let sessionId;

let heartbeatAck = false;
let zombieHeartbeatCount = 0;
let isForceClosed = false;

const url = "wss://gateway.discord.gg/?encoding=json&v=9";

function connect(isResuming = false) {
    const t = Date.now();
    console.log("[FAST CONNECT] connecting to: " + url);
    const ws = new WebSocket(url);

    ws.on('open', () => {
        console.log("[FAST CONNECT] connected in " + (Date.now() - t) + "ms");
        if (isResuming) {
            resumeSession(ws);
        } else {
            const identifyPayload = {
                op: 2,
                d: {
                    token: process.env.TOKEN,
                    properties: {
                        $os: 'anu',
                        $browser: 'anu',
                        $device: 'anu'
                    },
                    presence: {
                        activities: [{
                            name: 'anu help',
                            type: 2
                        }],
                        status: 'online',
                        afk: false
                    },
                    intents: 14023
                }
            };
            ws.send(JSON.stringify(identifyPayload));
        }
    });

    ws.on('close', (_, code) => {
        clearInterval(interval);
        heartbeatAck = false;
        zombieHeartbeatCount = 0;
        console.log("[" + utils().getCurrentTimeStr() + "] " + "Websocket closed.");
        console.log("[" + utils().getCurrentTimeStr() + "] " + "Bye bye...");
        if (!isForceClosed) {
            console.log();
            console.log("[" + utils().getCurrentTimeStr() + "] " + "NEW CONNECTION");
            connect();
        }
    });

    ws.on('message', (data) => {
        let payload = JSON.parse(data);
        const { t, s, op, d } = payload;

        // console.log("[" + utils.getCurrentTimeStr() + "] " + `t: ${t}; s: ${s}; op: ${op}`);

        switch (op) {
            case 0:
                sequence = s;
                // console.log();
                // console.log(`[${utils().getCurrentTimeStr()}] [EVENT] ${t}`);
                handleEvent(t, s, op, d, ws);
                break;
            case 7:
                console.log(`[${utils().getCurrentTimeStr()}] SHOULD RECONNECT`);
                ws.close();
                isForceClosed = true;
                setTimeout(() => {
                    connect(true);
                }, 1000);
                break;
            case 9:
                console.log(`[${utils().getCurrentTimeStr()}] INVALID SESSION`);
                ws.close();
                isForceClosed = true;
                exit(0);
            case 10:
                const { heartbeat_interval } = d;
                interval = heartbeat(heartbeat_interval, ws);
                break;
            case 11:
                heartbeatAck = true;
                zombieHeartbeatCount = 0;
                console.log(`[${utils().getCurrentTimeStr()}] SERVER HEARTBEAT ACK`);
                break;
            default:
                console.log();
                console.log(payload);
                console.log();
                break;
        }
    });
}

function handleEvent(t, s, op, d, ws) {
    switch (t) {
        case 'READY':
            sessionId = d.session_id;
            break;
        // case 'READY_SUPPLEMENTAL':
        //     d.guilds.forEach((guild) => {
        //         guild.voice_states.forEach((voiceState) => {
        //             updateMusicGuildData(guild.id, voiceState.channel_id, voiceState.user_id);
        //             leaveVoiceChannelIfAlone(guild.id);
        //         });
        //     });
        //     break;
        case 'VOICE_STATE_UPDATE':
            updateMusicGuildData(d.guild_id, d.channel_id, d.user_id);
            leaveVoiceChannelIfAlone(d.guild_id);
            break;
        case 'MESSAGE_CREATE':
            commandHandler().handle(d, ws);
            break;
        case 'GUILD_CREATE':
            d.voice_states.forEach((voiceState) => {
                updateMusicGuildData(d.id, voiceState.channel_id, voiceState.user_id);
                leaveVoiceChannelIfAlone(d.id);
            });
            break;
        default:
            break;
    }
}

function updateMusicGuildData(guildId, channelId, userId) {
    if (userId == process.env.BOT_ID) {
        setBotCurrentVoiceChannelId(channelId);
    }

    addGuildVoiceStateEntry(guildId, {
        id: userId,
        channel_id: channelId
    });

    if (userId == process.env.BOT_ID) {
        recountBotVoiceChannelMember(guildId);
    }
}

function leaveVoiceChannelIfAlone(guildId) {
    setTimeout(() => {
        const guildMusicPlayer = getGuildMusicPlayer(guildId);
        if (guildMusicPlayer && getBotVoiceChannelMemberCount() <= 1) {
            guildMusicPlayer.onAlone();
        }
    }, 5e3);
}

function heartbeat(h, ws) {
    if (zombieHeartbeatCount == 3) {
        console.log(`[${utils().getCurrentTimeStr()}] ZOMBIED CONNECTION`);
        ws.close();
        isForceClosed = true;
        connect(true);
        return;
    }

    return setInterval(() => {
        console.log(`[${utils().getCurrentTimeStr()}] [HEARTBEATING]`);
        ws.send(JSON.stringify({ op: 1, d: sequence }));
        heartbeatAck = false;
        zombieHeartbeatCount++;
    }, h);
}

function resumeSession(ws) {
    const payload = {
        op: 6,
        d: {
            token: process.env.TOKEN,
            session_id: sessionId,
            seq: sequence
        }
    }
    console.log(`[${utils().getCurrentTimeStr()}] [RESUMING SESSION]`);
    ws.send(JSON.stringify(payload));
}

connect();
