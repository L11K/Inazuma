'use strict';
const tool = require('../tool.js');

/*
The music player for a guild.
Handles the queuing, and streaming of Songs.
*/
class MusicPlayer {
    constructor() {
        this.queue = [];
        this.musicChannel = null;
        this.voiceConnection = null;
        this.dispatch = null;
        this.volume = 1;
        this.status = 'offline'; //States: offline, playing, stopped
        this.inactivityTimer = 60;
    }

    /*
    Adds the song to the queue.
    If an index argument is included, insert the song at that index instead of pushing it to the queue.

    @param {Object} song The song to queue.
    @param {Number} [index] The index to insert the song at.
    */
    queueSong(song) {
        let index;
        if (arguments.length == 2)
            index = arguments[1];
        if (index != undefined) {
            this.queue[index] = song;
        } else {
            this.queue.push(song);
        }
    }

    /*
    A recursive function that plays the queue.
    */
    playSong(msg) {
        if (this.queue.length === 0) {
            this.musicChannel.send('Queue complete.');
            this.changeStatus('stopped');
        } else {
            resolveVoiceChannel.call(this).then(() => {
                let song = this.queue[0];
                let stream = song.getStream();

                this.musicChannel.send(`:notes: Now playing ${tool.wrap(song.title)}`);
                this.changeStatus('playing');
                this.dispatch = this.voiceConnection.playStream(stream, {
                    passes: 2,
                    volume: this.volume
                });

                this.dispatch.on('error', error => {
                    console.log(error);
                    this.dispatch = null;
                    this.queue.shift();
                    this.playSong(msg);
                });

                this.dispatch.on('end', reason => {
                    this.dispatch = null;
                    this.queue.shift();
                    if (reason != 'leave') {
                        this.playSong(msg);
                    }
                });

                this.dispatch.on('debug', info => {
                    console.log(info);
                });
            }).catch(err => {
                if (err != 'novoice') console.log(err);
            });
        }

        /*
        Resolves the voice channel.
        @return Promise - resolved if the bot is connected to a voice channel, and rejected if not.
        */
        function resolveVoiceChannel() {
            return new Promise((resolve, reject) => {
                if (this.voiceConnection)
                    resolve();
                else {
                    msg.channel.send(
                        `Please summon me using ${tool.wrap('~music join')} to start playing the queue.`
                    );
                    reject('novoice');
                }
            });
        }
    }

    /*
    Skips the current song.
    */
    skipSong() {
        if (this.dispatch && this.status == 'playing') {
            this.musicChannel.send(`:fast_forward: Skipped ${tool.wrap(this.queue[0].title)}`);
            this.dispatch.end();
        } else {
            this.musicChannel.send(`There's nothing to skip! ${tool.inaBaka}`);
        }
    }

    /*
    Pauses the dispatcher.
    */
    pauseSong() {
        if (this.dispatch)
            this.dispatch.pause();
        else
            this.musicChannel.send(`Nothing is playing right now. ${tool.inaBaka}`);
    }

    /*
    Resumes the dispatcher.
    */
    resumeSong() {
        if (this.dispatch)
            this.dispatch.resume();
        else
            this.musicChannel.send(`Nothing is playing right now. ${tool.inaBaka}`);

    }

    /*
    Prints the queue.
    */
    printQueue(msg) {
        if (this.queue.length > 0) {
            try {
                let queueString = '';
                for (let i = 0; i < this.queue.length && i < 15; i++)
                    queueString += `${i + 1}. ${this.queue[i].title}\n`;
                if (this.queue.length > 15)
                    queueString += `\nand ${this.queue.length - 15} more.`;
                msg.channel.send(queueString, {
                    'code': true
                });
            } catch (err) {
                console.log('ERROR CAUGHT:\n' + err);
                msg.channel.send(
                    `${tool.inaError} Gomen, I can't display the queue right now. Try again in a few moments onegai.`
                );
            }
        } else {
            msg.channel.send(`There are no songs in the queue!`);
        }
    }

    /*
    Clears the queue.
    */
    purgeQueue(msg) {
        this.queue = [];
        msg.channel.send('The queue has been cleared.');
    }

    /*
    Displays the currently playing song.
    */
    nowPlaying(msg) {
        if (this.queue.length > 0)
            msg.channel.send(`:notes: Now playing ${tool.wrap(this.queue[0].title)}.`);
        else
            msg.channel.send('Nothing is playing right now.');
    }

    /*
    Sets the volume of the dispatcher.
    */
    setVolume(msg) {
        let vol = parseInt(msg.content.split(/\s+/)[2]) / 100;
        if (vol && (vol >= 0 && vol <= 1)) {
            if (this.dispatch) {
                this.dispatch.setVolume(vol);
                this.volume = vol;
                msg.channel.send(`:speaker:Volume set to ${tool.wrap(vol * 100)}`);
            } else {
                msg.channel.send(`Nothing is playing right now. ${tool.inaAngry}`);
            }
        } else {
            msg.channel.send(`Use a number between 0 and 100! ${tool.inaBaka}`);
        }
    }

    /*
    Summons the bot to the user's voice channel.
    */
    joinVc(msg) {
        if (msg.member.voiceChannel) {
            this.musicChannel = msg.channel;
            msg.member.voiceChannel.join().then(connection => {
                this.voiceConnection = connection;
                this.musicChannel.send(
                    `Joined and bound to :speaker: **${msg.member.voiceChannel.name}** and #**${this.musicChannel.name}**.`
                );
                this.changeStatus('stopped');
                if (this.queue.length > 0)
                    this.playSong(msg);
            })
        } else {
            msg.channel.send(`You're not in a voice channel! ${tool.inaBaka}`);
        }
    }

    /*
    Disconnects from the voice channel.
    */
    leaveVc(msg) {
        if (this.voiceConnection) {
            this.musicChannel.send(`Leaving **${this.voiceConnection.channel.name}**.`);
            this.musicChannel = null;
            if (this.dispatch)
                this.dispatch.end('leave');
            this.voiceConnection.disconnect();

            this.changeStatus('offline');

            this.voiceConnection = null;
            this.dispatch = null;
        } else {
            msg.channel.send(`I'm not in a voice channel! ${tool.inaBaka}`);
        }
    }

    /*
    Changes the status of the bot.
    @param {String} status The status to set the bot to.
    */
    changeStatus(status) {
        this.status = status;
        this.inactivityTimer = status == 'paused' ?
            600 :
            120;
    }
}

module.exports = MusicPlayer;
