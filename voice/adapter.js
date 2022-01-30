let adapter = null;

const trackClientCallback = (data) => {
    let payload = JSON.parse(data);
    const { t, op, d } = payload;

    if (op == 0) {
        switch (t) {
            case 'VOICE_SERVER_UPDATE':
                adapter?.onVoiceServerUpdate(d);
                break;
            case 'VOICE_STATE_UPDATE':
                if (d.guild_id && d.session_id && d.user_id == process.env.BOT_ID) {
                    console.log(d);
                    adapter?.onVoiceStateUpdate(d);
                }
                break;
            default:
                break;
        }
    }
};

function trackClient(ws) {
    ws.on('message', trackClientCallback);
}

function createBotAdapter(ws) {
    return (methods) => {
        adapter = methods;
        trackClient(ws);
        return {
            sendPayload(data) {
                ws.send(JSON.stringify(data));
                return true;
            },
            destroy() {
                adapter = null;
                ws.removeListener('message', trackClientCallback);
            },
        };
    };
}

module.exports = {
    createBotAdapter
};
