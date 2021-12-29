let fetch;
const crypto = require('crypto');
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser');
const { Blob, FormData } = require('formdata-node');

import('node-fetch').then((module) => {
    fetch = module.default;
});

class MentionType {
    static U2 = 'U2';
    static U1R1 = 'U1R1';
    static U1 = 'U1';
    static R2 = 'R2';
    static R1U1 = 'R1U1';
    static R1 = 'R1';
    static NM = 'NM';
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
                    "Authorization": process.env.TOKEN,
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
                    "Authorization": process.env.TOKEN,
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
                    "Authorization": process.env.TOKEN,
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
                    "Authorization": process.env.TOKEN,
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

function sendImage(guildId, channelId, blob, filename) {
    return new Promise(async (resolve, reject) => {
        console.log("Sending image...");
        const formData = new FormData();
        formData.set('files[0]', blob, filename);
        formData.set('payload_json', '{"content":"","type":0,"attachments":[{"id":"0","filename":"' + filename + '"}]}');

        try {
            let response = await fetch("https://discord.com/api/v9/channels/" + channelId + "/messages", {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Authorization": process.env.TOKEN,
                    "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6OTMuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC85My4wIiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTA4NDcxLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
                    "X-Discord-Locale": "en-US",
                    "X-Debug-Options": "bugReporterEnabled",
                    "Alt-Used": "discord.com",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin"
                },
                "referrer": "https://discord.com/channels/" + guildId + "/" + channelId,
                "body": formData,
                "method": "POST",
                "mode": "cors"
            });

            if (response.status == 200) {
                console.log("Image sent.");
                const responseJson = await response.json();
                resolve({
                    status: response.status,
                    data: responseJson,
                });
            } else {
                console.log("Failed to send an image. " + response.status);
            }
        } catch (error) {
            console.log("Error when sending an image.");
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
                    console.log("Getting random quote failed. " + response.status);
                }
            }
        } catch (error) {
            console.error(error);
            console.log("Error when getting random quote.");
            reject("Error when connecting to the API. :sob: ");
        }
    });
}

function isMsgMentioningUser(msgData, index = 2) {
    const msgDataSplit = msgData.content.split(" ");
    if (msgDataSplit.length >= (index + 1)) {
        if (!isMsgMentioningRole(msgData, index)
            && (msgDataSplit[index].startsWith("<@") && msgDataSplit[index].endsWith(">"))) {
            return true;
        }
    }
    return false;
}

function isMsgMentioningRole(msgData, index = 2) {
    const msgDataSplit = msgData.content.split(" ");
    if (msgDataSplit.length >= (index + 1)) {
        if ((msgDataSplit[index].startsWith("<@&") && msgDataSplit[index].endsWith(">"))) {
            return true;
        }
    }
    return false;
}

function getMentionType(msgData) {
    if (isMsgMentioningUser(msgData) && isMsgMentioningUser(msgData, 3)) {
        return MentionType.U2;
    } else if (isMsgMentioningUser(msgData) && isMsgMentioningRole(msgData, 3)) {
        return MentionType.U1R1;
    } else if (isMsgMentioningUser(msgData)) {
        return MentionType.U1;
    } else if (isMsgMentioningRole(msgData) && isMsgMentioningRole(msgData, 3)) {
        return MentionType.R2;
    } else if (isMsgMentioningRole(msgData) && isMsgMentioningUser(msgData, 3)) {
        return MentionType.R1U1;
    } else if (isMsgMentioningRole(msgData)) {
        return MentionType.R1;
    } else {
        return MentionType.NM;
    }
}

const emptycb = () => { };

function handleMentioningMessage(
    msgData,
    u2cb = emptycb,
    u1r1cb = emptycb,
    u1cb = emptycb,
    r2cb = emptycb,
    r1u1cb = emptycb,
    r1cb = emptycb,
    nmcb = emptycb
) {
    if (isMsgMentioningUser(msgData) && isMsgMentioningUser(msgData, 3)) {
        u2cb();
    } else if (isMsgMentioningUser(msgData) && isMsgMentioningRole(msgData, 3)) {
        u1r1cb();
    } else if (isMsgMentioningUser(msgData)) {
        u1cb();
    } else if (isMsgMentioningRole(msgData) && isMsgMentioningRole(msgData, 3)) {
        r2cb();
    } else if (isMsgMentioningRole(msgData) && isMsgMentioningUser(msgData, 3)) {
        r1u1cb();
    } else if (isMsgMentioningRole(msgData)) {
        r1cb();
    } else {
        nmcb();
    }
}

function getMentionedUserId(msgData, index = 2) {
    const msgDataSplit = msgData.content.split(" ");
    const mentionedUserId = msgDataSplit[index].slice(2, -1).replace(`!`, '');
    return mentionedUserId;
}

function getUser(id) {
    return new Promise(async (resolve) => {
        console.log("Getting user data...");
        try {
            const response = await fetch("https://discord.com/api/v9/users/" + id, {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Authorization": process.env.TOKEN,
                    "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6OTMuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC85My4wIiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTA4OTI0LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
                    "X-Discord-Locale": "en-US",
                    "X-Debug-Options": "bugReporterEnabled",
                    "Alt-Used": "discord.com",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "no-cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache"
                },
                "method": "GET",
                "mode": "cors"
            });

            if (response.status == 200) {
                console.log("Getting user data success.");
                const responseJson = await response.json();
                resolve({
                    status: response.status,
                    data: responseJson,
                });
            } else {
                console.log("Failed to get user data. " + response.status);
            }
        } catch (error) {
            console.log("Error when getting user data.");
            console.log(error);
        }
    });
}

function sendPhotoTask(data) {
    return new Promise(async (resolve) => {
        const signData = crypto.createHmac('sha1', process.env.PHOTO_API_KEY).update(data).digest('hex');
        console.log("Sending pho.to task...");
        try {
            const response = await fetch("https://opeapi.ws.pho.to/addtask", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: "app_id=" + process.env.PHOTO_API_APPID + "&sign_data=" + signData + "&data=" + data,
            });

            if (response.status == 200) {
                console.log("Sending pho.to task sucess");
                const responseText = await response.text();
                resolve({
                    status: response.status,
                    data: responseText
                });
            } else {
                console.log("Failed to send pho.to task. " + response.status);
            }
        } catch (error) {
            console.log("Error when sending pho.to task.");
        }
    });
}

function getPhotoResult(requestId) {
    return new Promise(async (resolve) => {
        console.log("Getting pho.to result...");
        try {
            const response = await fetch("https://opeapi.ws.pho.to/getresult?request_id=" + requestId);
            if (response.status == 200) {
                console.log("Getting pho.to result success.");
                const responseText = await response.text();
                resolve({
                    status: response.status,
                    data: responseText
                });
            } else {
                console.log("Failed to get pho.to result. " + response.status);
            }
        } catch (error) {
            console.log("Error when getting pho.to result.");
        }
    });
}

function fetchImageBlob(url) {
    return new Promise(async (resolve) => {
        console.log("Getting the image...");
        try {
            const response = await fetch(url);
            if (response.status == 200) {
                console.log("Getting the image success.");
                response.arrayBuffer().then((res) => {
                    resolve({
                        status: response.status,
                        data: new Blob([res], { type: "image/gif" })
                    });
                });
            } else {
                console.log("Failed to get the image. " + response.status);
            }
        } catch (error) {
            console.log("Error when getting the image.");
        }
    });
}

function parseXml(xml) {
    return (new XMLParser()).parse(xml);
}

function buildXml(map) {
    return (new XMLBuilder()).build(map);
}

function removeNonAscii(str) {
    return str.replace(/[^\x00-x7F]/g, '');
}

function capitalizeFirstLetterEachWord(str) {
    const strSplit = str.split(" ");
    const newStrSplit = strSplit.map((value) => {
        return value.charAt(0).toUpperCase() + value.slice(1);
    });
    let newStr = '';
    newStrSplit.forEach((value, index) => {
        newStr += value;
        if (index != (newStrSplit.length - 1)) {
            newStr += ' ';
        }
    })
    return newStr;
}

function getUserAvatarUrl(id, avaHash, size = 512) {
    return `https://cdn.discordapp.com/avatars/${id}/${avaHash}.png?size=${size}`;
}

module.exports = {
    MentionType: MentionType,
    editServerNick: editServerNick,
    deleteMessage: deleteMessage,
    editMessage: editMessage,
    sendMessage: sendMessage,
    sendImage: sendImage,
    getCurrentTimeStr: getCurrentTimeStr,
    getRandomQuote: getRandomQuote,
    isMsgMentioningUser: isMsgMentioningUser,
    isMsgMentioningRole: isMsgMentioningRole,
    getMentionType: getMentionType,
    handleMentioningMessage: handleMentioningMessage,
    emptycb: emptycb,
    getUser: getUser,
    getMentionedUserId: getMentionedUserId,
    sendPhotoTask: sendPhotoTask,
    getPhotoResult: getPhotoResult,
    fetchImageBlob: fetchImageBlob,
    parseXml: parseXml,
    buildXml: buildXml,
    removeNonAscii: removeNonAscii,
    getUserAvatarUrl: getUserAvatarUrl,
    capitalizeFirstLetterEachWord: capitalizeFirstLetterEachWord
}