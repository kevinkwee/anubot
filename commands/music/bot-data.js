/**
 * @type { Map<String, MusicPlayer> }
 */
let musicPlayers = new Map();

/**
 * 
 * @param {String} guildId 
 * @returns If exist, return MusicPlayer object from provided guildId.
 * Else, return undefined/null.
 */
function getGuildMusicPlayer(guildId) {
    return musicPlayers.get(guildId);
}

function setGuildMusicPlayer(guildId, musicPlayer) {
    musicPlayers.set(guildId, musicPlayer);
}

module.exports = {
    getGuildMusicPlayer,
    setGuildMusicPlayer
};
