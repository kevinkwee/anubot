const { createAudioResource } = require('@discordjs/voice');
const playdl = require('play-dl');

class Track {
    /**
     * @private
     */
    constructor({ url, title, thumbnailUrl, durationInSec, uploader, uploaderUrl, requesterId }) {
        this.url = url;
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.durationInSec = durationInSec;
        this.uploaderUrl = uploaderUrl;
        this.uploader = uploader;
        this.requesterId = requesterId;
    }

    /**
     * Factory to create Track from Youtube.
     * @param {String | playdl.YouTubeVideo} source valid Youtube track url.
     * @returns new Track object.
     */
    static async fromYoutube(source, requesterId) {
        try {
            /**
             * @type {playdl.YouTubeVideo}
             */
            let yt_video;

            if (source instanceof playdl.YouTubeVideo) {
                yt_video = source;
            } else {
                const yt_info = await playdl.video_basic_info(source);
                yt_video = yt_info.video_details;
            }

            const thumbnails = yt_video.thumbnails;
            return new Track({
                url: yt_video.url,
                title: yt_video.title,
                thumbnailUrl: thumbnails[thumbnails.length - 1].url,
                durationInSec: yt_video.durationInSec,
                uploader: yt_video.channel.name,
                uploaderUrl: yt_video.channel.url,
                requesterId: requesterId
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Factory to create Track from Soundcloud.
     * @param {String | playdl.SoundCloudTrack} source Soundcloud source.
     * @returns new Track object.
     */
    static async fromSoundcloud(source, requesterId) {
        try {
            /**
             * @type {playdl.SoundCloudTrack}
             */
            let sc_info;

            if (source instanceof playdl.SoundCloudTrack) {
                sc_info = source;
            } else {
                sc_info = await playdl.soundcloud(source);
            }

            return new Track({
                url: sc_info.url,
                title: sc_info.name,
                durationInSec: sc_info.durationInSec,
                thumbnailUrl: sc_info.thumbnail,
                uploader: sc_info.publisher.artist,
                uploaderUrl: sc_info.user.url,
                requesterId: requesterId
            });
        } catch (error) {
            throw error;
        }
    }

    async createAudioResource() {
        try {
            let trackStream = await playdl.stream(this.url);
            return createAudioResource(trackStream.stream, {
                inputType: trackStream.type,
                metadata: this
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Track;
