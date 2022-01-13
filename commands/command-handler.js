const commands = require('./command-index');

function handle(message, ws) {
    const contentSplit = message.content.splitByWhitespace();

    if (contentSplit[0].toLowerCase() !== process.env.CMD_PREFIX) return;

    commands.some((botcmd) => {
        if (contentSplit[1].toLowerCase() === botcmd.keyword) {
            botcmd.callback(message, ws);
            return true;
        }
        return botcmd.aliases.some((alias) => {
            if (contentSplit[1].toLowerCase() === alias) {
                botcmd.callback(message, ws);
                return true;
            }
        });
    });
}

module.exports = {
    handle
};