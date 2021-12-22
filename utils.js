let fetch;

import('node-fetch').then((module) => {
    fetch = module.default;
});

module.exports = {
    editServerNick: editServerNick,
    deleteMessage: deleteMessage,
    editMessage: editMessage,
    sendMessage: sendMessage,
    getCurrentTimeStr: getCurrentTimeStr,
    getRandomQuote: getRandomQuote
}

function getCurrentTimeStr() {
    return (new Date()).toLocaleString();
}

function editServerNick(guildId, nick) {
    return new Promise(async (resolve) => {
        try {
            console.log("Editing server nick...");
            const response = await fetch("https://discord.com/api/v9/guilds/" + guildId + "/members/@me", {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Content-Type": "application/json",
                    "Authorization": "OTIxMzcxMzM3NDc2NDI3ODM2.Ybx9Ag.aeksutojF1EruNF4XAmnIasN6hk",
                    "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6OTMuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC85My4wIiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTA4NDcxLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
                    "X-Discord-Locale": "en-US",
                    "X-Debug-Options": "bugReporterEnabled",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin"
                },
                "body": "{\"nick\":\"" + nick + "\"}",
                "method": "PATCH",
                "mode": "cors"
            });

            if (response.status == 200) {
                console.log("Server nick edited.");
                const responseJson = await response.json();
                resolve({
                    status: response.status,
                    data: responseJson,
                });
            } else {
                console.log("Failed to edit server nick. " + response.status);
            }
        } catch (error) {
            console.log("Error when editing server nick.");
            // console.log("Exiting...");
            // ws.close();
        }
    });
}

function deleteMessage(guildId, channelId, messageId) {
    return new Promise(async (resolve, reject) => {
        console.log("Deleting message...");
        try {
            const response = await fetch("https://discord.com/api/v9/channels/" + channelId + "/messages/" + messageId, {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Authorization": "OTIxMzcxMzM3NDc2NDI3ODM2.Ybx9Ag.aeksutojF1EruNF4XAmnIasN6hk",
                    "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6OTMuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC85My4wIiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTA4NDcxLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
                    "X-Discord-Locale": "en-US",
                    "X-Debug-Options": "bugReporterEnabled",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin"
                },
                "referrer": "https://discord.com/channels/" + guildId + "/" + channelId,
                "method": "DELETE",
                "mode": "cors"
            });

            if (response.status == 204) {
                console.log("Deleting message success.");
                resolve({
                    status: response.status,
                    data: null,
                });
            } else {
                console.log("Deleting message failed with code. " + response.status);
                // reject({
                //     status: response.status,
                //     data: null,
                // });
            }
        } catch (error) {
            console.log("Deleting message error. Retrying...");
            // deleteMessage(guildId, channelId, messageId);
        }
    });
}

function editMessage(guildId, channelId, messageId, content, embeds = []) {
    return new Promise(async (resolve, reject) => {
        console.log("Editing message...");
        try {
            const response = await fetch("https://discord.com/api/v9/channels/" + channelId + "/messages/" + messageId, {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Content-Type": "application/json",
                    "Authorization": "OTIxMzcxMzM3NDc2NDI3ODM2.Ybx9Ag.aeksutojF1EruNF4XAmnIasN6hk",
                    "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6OTMuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC85My4wIiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTA4NDcxLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
                    "X-Discord-Locale": "en-US",
                    "X-Debug-Options": "bugReporterEnabled",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin"
                },
                "referrer": "https://discord.com/channels/" + guildId + "/" + channelId,
                "body": "{\"content\":\"" + content + "\",\"embeds\":" + JSON.stringify(embeds) + "}",
                "method": "PATCH",
                "mode": "cors"
            });

            if (response.status == 200) {
                console.log("Message edited.");
                const responseJson = await response.json();
                resolve({
                    status: response.status,
                    data: responseJson,
                });
            } else {
                console.log("Failed to edit a message. " + response.status);
                // reject({
                //     status: response.status,
                //     data: null,
                // });
            }
        } catch (error) {
            console.log("Error when editing message. Retrying...");
            // editMessage(guildId, channelId, messageId, content);
        }
    });
}

function sendMessage(guildId, channelId, content, embeds = []) {
    return new Promise(async (resolve, reject) => {
        console.log("Sending message...");
        try {
            let response = await fetch("https://discord.com/api/v9/channels/" + channelId + "/messages", {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Content-Type": "application/json",
                    "Authorization": "OTIxMzcxMzM3NDc2NDI3ODM2.Ybx9Ag.aeksutojF1EruNF4XAmnIasN6hk",
                    "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6OTMuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC85My4wIiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTA4NDcxLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
                    "X-Discord-Locale": "en-US",
                    "X-Debug-Options": "bugReporterEnabled",
                    "Alt-Used": "discord.com",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin"
                },
                "referrer": "https://discord.com/channels/" + guildId + "/" + channelId,
                "body": '{\"content\":\"' + content + '\",\"tts\":false,\"embeds\":' + JSON.stringify(embeds) + '}',
                "method": "POST",
                "mode": "cors"
            });

            if (response.status == 200) {
                console.log("Message sent.");
                const responseJson = await response.json();
                resolve({
                    status: response.status,
                    data: responseJson,
                });
            } else {
                console.log("Failed to send a message. " + response.status);
                // reject({
                //     status: response.status,
                //     data: null,
                // });
            }
        } catch (error) {
            console.log("Error when sending message. Retrying...");
            // sendMessage(guildId, channelId, content);
        }
    });
}

function getRandomQuote() {
    return new Promise(async (resolve, reject) => {
        console.log("Getting random quote...");
        try {
            while (true) {
                const response = await fetch('https://zenquotes.io/api/quotes/');
                if (response.status == 200) {
                    let data = await response.json();
                    console.log("Getting quote success.");
                    resolve(data);
                    break;
                } else {
                    console.log("Getting random quote failed. Retrying...");
                }
            }
        } catch (error) {
            console.error(error);
            console.log("Error when getting random quote.");
            reject("Error when connecting to the API. :sob: ");
        }
    });
}
