let guildVoiceStates = new Map();

let guildVoiceStatesLock = false;

/**
 * The number of members on the
 * channel where the bot joins.
 * (Bot included)
 */
let botVoiceChannelMemberCount = 0;
let botCurrentVoiceChannelId = null;

function lockGuildVoiceStates() {
    guildVoiceStatesLock = true;
}

function unlockGuildVoiceStates() {
    guildVoiceStatesLock = false;
}

function getGuildVoiceState(guildId) {
    return guildVoiceStates.get(guildId);
}

/**
 * 
 * @param {String} guildId 
 * @param {{id: string, channel_id: string}} data {id: user id, channel_id: channel where user joined}
 */
function addGuildVoiceStateEntry(guildId, data) {
    if (guildVoiceStatesLock) {
        addGuildVoiceStateEntry(guildId, data);
        return;
    }

    trackUserVoiceChannel(guildId, data.channel_id, data.id);

    lockGuildVoiceStates();
    let guildState = new Map();

    if (guildVoiceStates.has(guildId)) {
        guildState = getGuildVoiceState(guildId);
    }

    guildState.set(data.id, data.channel_id);
    guildVoiceStates.set(guildId, guildState);
    unlockGuildVoiceStates();
}

/**
 * Get the user's current voice channel id.
 * @param {String} guildId Guild id where the user sent the message.
 * @param {String} userId Message author's id.
 * @returns Return current user's channel id or undefined/null.
 */
function getUserCurrentVoiceChannelId(guildId, userId) {
    return getGuildVoiceState(guildId)?.get(userId);
}

function getBotVoiceChannelMemberCount() {
    return botVoiceChannelMemberCount;
}

function incrementBotVoiceChannelMemberCount(incrementValue = 1) {
    botVoiceChannelMemberCount += incrementValue;
}

function decrementBotVoiceChannelMemberCount(decrementValue = 1) {
    botVoiceChannelMemberCount -= decrementValue;
}

function getBotCurrentVoiceChannelId() {
    return botCurrentVoiceChannelId;
}

function setBotCurrentVoiceChannelId(channelId) {
    botCurrentVoiceChannelId = channelId;
}

/**
 * Track user voice state update.
 * Determines whether the user enters or exits
 * the voice channel in which the bot joins or not.
 * RUN THIS FUNCTION BEFORE addGuildVoiceEntry function.
 * @param {string} guildId 
 * @param {string} channelId
 * @param {string} userId 
 */
function trackUserVoiceChannel(guildId, channelId, userId) {
    if (guildVoiceStatesLock) {
        trackUserVoiceChannel(guildId, channelId, userId);
        return;
    }

    lockGuildVoiceStates();
    const oldUserVoiceChannelId = getUserCurrentVoiceChannelId(guildId, userId);
    const newUserVoiceChannelId = channelId;

    // The user joins to the bot's voice channel.
    if (
        oldUserVoiceChannelId != botCurrentVoiceChannelId &&
        newUserVoiceChannelId == botCurrentVoiceChannelId
    ) {
        incrementBotVoiceChannelMemberCount();
    }

    // The user exits from bot's voice channel.
    if (
        oldUserVoiceChannelId == botCurrentVoiceChannelId &&
        newUserVoiceChannelId != botCurrentVoiceChannelId
    ) {
        decrementBotVoiceChannelMemberCount();
    }
    unlockGuildVoiceStates();
}

function recountBotVoiceChannelMember(guildId) {
    if (guildVoiceStatesLock) {
        recountBotVoiceChannelMember(guildId);
    }


    botVoiceChannelMemberCount = 0;

    if (!botCurrentVoiceChannelId) {
        return;
    }

    lockGuildVoiceStates();

    /**
     * @type {Map}
     */
    const guildVoiceState = getGuildVoiceState(guildId) ?? new Map();

    guildVoiceState.forEach((channelId) => {
        if (channelId == botCurrentVoiceChannelId) {
            incrementBotVoiceChannelMemberCount();
        }
    });
    unlockGuildVoiceStates();
}

module.exports = {
    getGuildVoiceState,
    addGuildVoiceStateEntry,
    getUserCurrentVoiceChannelId,
    getBotVoiceChannelMemberCount,
    incrementBotVoiceChannelMemberCount,
    decrementBotVoiceChannelMemberCount,
    getBotCurrentVoiceChannelId,
    setBotCurrentVoiceChannelId,
    recountBotVoiceChannelMember
};
