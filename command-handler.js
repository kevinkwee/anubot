const ScriptLoader = require('./ScriptLoader.js');
const commandsLoader = new ScriptLoader('./commands.js');

const commands = () => { return commandsLoader.script };

function handle(message, ws) {
    const contentSplit = message.content.split(" ");

    if (contentSplit[0].toLowerCase() !== process.env.CMD_PREFIX) return;

    commands().forEach((botcmd) => {
        if (contentSplit[1].toLowerCase() === botcmd.keyword
            || contentSplit[1].toLowerCase() === botcmd.alias) {
            botcmd.callback(message, ws);
        }
    });
}

module.exports = {
    handle: handle
};