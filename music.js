'use strict';
const config = require('./config.json');
const tool = require('./tool.js');
const ani = require('./anime.js');

const Song = require('./obj/Song.js');
const MusicHandler = require('./obj/MusicHandler.js');

const youtubeDL = require('youtube-dl');
const ytdl = require('ytdl-core');
const rp = require('request-promise');

module.exports.processCommand = processCommand;

let guilds = {};

/*
The music command handler.
*/
function processCommand(msg) {
    if (!msg.guild.available) return;
    //Add guild to the guild list.
    if (!guilds[msg.guild.id])
        guilds[msg.guild.id] = {
            queue: [],
            musicChannel: msg.guild.channels.find('name', 'music'),
            voiceConnection: null,
            dispatch: null,
            volume: 1,
            status: 'offline', //States: offline, playing, stopped
            inactivityTimer: 60
        };

    let guild = guilds[msg.guild.id];

    if (!guild.musicChannel) {
        guild.musicChannel = msg.guild.channels.find('name', 'music');
        if (!guild.musicChannel) {
            msg.channel.send(`Please create a ${tool.wrap('#music')} channel!`);
            return;
        }
    }

    let musicCmd = msg.content.split(/\s+/)[1];
    if (musicCmd)
        musicCmd.toLowerCase();
    switch (musicCmd) {
        case 'play':
            return processInput(msg, guild);
        case 'skip':
            return skipSong(guild);
        case 'pause':
            return pauseSong(guild);
        case 'resume':
            return resumeSong(guild);
        case 'queue':
            return printQueue(guild);
        case 'np':
            return nowPlaying(msg, guild);
        case 'vol':
            return setVolume(msg, guild);
        case 'purge':
            return purgeQueue(guild);

        case 'join':
            return join(msg, guild);
        case 'leave':
            return leave(msg, guild);

        case 'hime':
            return hime(msg, guild);
        default:
            msg.channel.send(`Please refer to ${tool.wrap('~help music')}.`);
    }
}

/*
Common Params:
@param Object guild - The guild that the message is from.

Song object:
  String title - Title of the song.
  Object url - The url/data needed to get the stream or the stream url of the song.
  String type - The type of song (youtube, soundcloud, search).
*/

/*
Processes user input for ~play command calls.
Determines what kind of input (search query, youtube video/playlist, soundcloud song/playlist) has been given, and proceeds accordingly.
*/
function processInput(msg, guild) {
    let url = msg.content.split(/\s+/).slice(2).join(' ');
    if (url) {
        if (!url.startsWith('http')) { //Assume its a search.
            processSearch(msg, guild, url);
        } else if (url.search('youtube.com')) { //Youtube.
            let playlist = url.match(/list=(\S+?)(&|\s|$|#)/); //Match playlist id.
            if (playlist) { //Playlist.
                youtube.processPlaylist(msg, guild, playlist[1]);
            } else if (url.search(/v=(\S+?)(&|\s|$|#)/)) { //Video.
                youtube.processSong(msg, guild, url);
            } else {
                msg.channel.send(`Invalid Youtube link! ${inaBaka}`);
            }
        } else if (url.search('soundcloud.com')) { //Soundcloud.
            msg.channel.send('Gomen, Soundcloud music isn\'nt functional right now.');
        } else {
            msg.channel.send('Gomen, I only support Youtube right now.');
        }
    }
}

/*
Adds the song to the queue.
If an index argument is included, insert the song at that index instead of pushing it to the queue.

@param {Object} song The song to queue.
@param {Number} [index] The index to insert the song at.
*/
function queueSong(msg, guild, song) {
    let index;
    if (arguments.length == 4)
        index = arguments[3];
    if (index || index == 0) {
        guild.queue[index] = song;
    } else {
        guild.queue.push(song);
    }
}

/*
A recursive function that plays the queue.
*/
function playSong(msg, guild) {
    if (guild.queue.length === 0) {
        guild.musicChannel.send('Queue complete.');
        changeStatus(guild, 'stopped');
    } else {
        resolveVoiceChannel().then(() => {
            let song = guild.queue[0];
            let stream = song.getStream();

            guild.musicChannel.send(`:notes: Now playing ${tool.wrap(song.title)}`);
            changeStatus(guild, 'playing');
            guild.dispatch = guild.voiceConnection.playStream(stream, {
                passes: 2,
                volume: guild.volume
            });

            guild.dispatch.on('error', error => {
                guild.dispatch = null;
                guild.queue.shift();
                setTimeout(playSong(msg, guild), 0);
            });

            guild.dispatch.on('end', reason => {
                guild.dispatch = null;
                guild.queue.shift();
                if (reason != 'leave') {
                    setTimeout(playSong(msg, guild), 0);
                }
            });

            guild.dispatch.on('debug', info => {
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
            if (guild.voiceConnection)
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
function skipSong(guild) {
    if (guild.dispatch && guild.queue[0]) {
        guild.musicChannel.send(`:fast_forward: Skipped ${tool.wrap(guild.queue[0].title)}`);
        guild.dispatch.end();
    } else {
        guild.musicChannel.send(`There\'s nothing to skip! ${tool.inaBaka}`);
    }
}

/*
Pauses the dispatcher.
*/
function pauseSong(guild) {
    if (guild.dispatch)
        guild.dispatch.pause();
    else
        guild.musicChannel.send(`Nothing is playing right now. ${tool.inaBaka}`);
}

/*
Resumes the dispatcher.
*/
function resumeSong(guild) {
    if (guild.dispatch)
        guild.dispatch.resume();
    else
        guild.musicChannel.send(`Nothing is playing right now. ${tool.inaBaka}`);

}

/*
Prints the queue.
*/
function printQueue(guild) {
    if (guild.queue.length > 0) {
        try {
            let queueString = '';
            for (let i = 0; i < guild.queue.length && i < 15; i++)
                queueString += `${i + 1}. ${guild.queue[i].title}\n`;
            if (guild.queue.length > 15)
                queueString += `\nand ${guild.queue.length - 15} more.`;
            guild.musicChannel.send(queueString, {
                'code': true
            });
        } catch (err) {
            console.log('ERROR CAUGHT:\n' + err);
            guild.musicChannel.send(
                `${tool.inaError} Gomen, I can't display the queue right now. Try again in a few moments onegai.`
            );
        }
    } else {
        guild.musicChannel.send(`There are no songs in the queue!`);
    }
}

/*
Clears the queue.
*/
function purgeQueue(guild) {
    guild.queue = [];
    guild.musicChannel.send('The queue has been cleared.');
}

/*
Displays the currently playing song.
*/
function nowPlaying(msg, guild) {
    if (guild.queue.length > 0)
        guild.musicChannel.send(`:notes: Now playing ${tool.wrap(guild.queue[0].title)}.`);
    else
        guild.musicChannel.send('Nothing is playing right now.');
}

/*
Sets the volume of the dispatcher.
*/
function setVolume(msg, guild) {
    let vol = parseInt(msg.content.split(/\s+/)[2]) / 100;
    if (vol && (vol >= 0 && vol <= 1)) {
        if (guild.dispatch) {
            guild.dispatch.setVolume(vol);
            guild.volume = vol;
            guild.musicChannel.send(`:speaker:Volume set to ${tool.wrap(vol * 100)}`);
        } else {
            guild.musicChannel.send(`Nothing is playing right now. ${tool.inaAngry}`);
        }
    } else {
        guild.musicChannel.send(`Use a number between 0 and 100! ${tool.inaBaka}`);
    }
}

/*
Summons the bot to the user's voice channel.
*/
function join(msg, guild) {
    if (msg.member.voiceChannel) {
        msg.member.voiceChannel.join().then(connection => {
            guild.voiceConnection = connection;
            guild.musicChannel.send(`Joining **${msg.member.voiceChannel.name}**.`);
            changeStatus(guild, 'stopped');
            if (guild.queue.length > 0)
                playSong(msg, guild);
        })
    } else {
        msg.channel.send(`You\'re not in a voice channel! ${tool.inaBaka}`);
    }
}

/*
Disconnects from the voice channel.
*/
function leave(msg, guild) {
    if (guild.voiceConnection) {
        guild.musicChannel.send(`Leaving **${guild.voiceConnection.channel.name}**.`);
        if (guild.dispatch)
            guild.dispatch.end('leave');
        guild.voiceConnection.disconnect();

        changeStatus(guild, 'offline');

        guild.voiceConnection = null;
        guild.dispatch = null;
    } else {
        guild.musicChannel.send(`I'm not in a voice channel! ${tool.inaBaka}`);
    }
}

/*
Hime hime.
*/
function hime(msg, guild) {
    msg.content = '~music play koi no hime pettanko';
    processInput(msg, guild);
}

/*
Changes the status of the bot.
@param {String} status The status to set the bot to.
*/
function changeStatus(guild, status) {
    guild.status = status;
    guild.inactivityTimer = status == 'paused' ?
        600 :
        120;
}

/*
Timer for inactivity. Leave voice channel after inactivity timer expires.
*/
function timer() {
    for (let guildId in guilds) {
        let guild = guilds[guildId];
        if (guild.status == 'stopped' || guild.status == 'paused')
            guild.inactivityTimer -= 30;
        if (guild.inactivityTimer <= 0) {
            guild.voiceConnection.disconnect();
            guild.voiceConnection = null;
            guild.musicChannel.send(':no_entry_sign: Leaving voice channel due to inactivity.');

            changeStatus(guild, 'offline');
        }
    }
}
setInterval(timer, 30000);

/*
SONG/PLAYLIST PROCESSING FUNCTIONS
*/
/*
Processes a search using youtube-dl, pushing the resulting song to the queue.
@param {String} seachQuery The search query.
*/
function processSearch(msg, guild, searchQuery) {
    searchQuery = 'gvsearch1:' + searchQuery;
    youtubeDL.getInfo(searchQuery, ['--extract-audio'], (err, song) => {
        if (err) {
            msg.channel.send(`Gomen, I couldn't find matching song.`);
            return console.log(err);
        }
        queueSong(msg, guild, new Song(song.title, song.url, 'search'));
        guild.musicChannel.send(
            `Enqueued ${tool.wrap(song.title.trim())} requested by ${tool.wrap(msg.author.username + '#' + msg.author.discriminator)} ${tool.inaHappy}`
        );

        if (guild.status != 'playing')
            playSong(msg, guild);
    });
}

/*
Processing functions for Youtube links.
*/
const youtube = {
    /*
    Processes a new song, pushing it to the queue.
    @param {String} url The URL of the new song.
    */
    processSong(msg, guild, url) {
        ytdl.getInfo(url, (err, song) => {
            if (err) {
                console.log(err);
                msg.channel.send(`Gomen I couldn't queue your song.`);
                return;
            }

            queueSong(msg, guild, new Song(song.title, url, 'youtube'));
            guild.musicChannel.send(
                `Enqueued ${tool.wrap(song.title.trim())} requested by ${tool.wrap(msg.author.username + '#' + msg.author.discriminator)} ${tool.inaHappy}`
            );
            if (guild.status != 'playing')
                playSong(msg, guild);
        });
    },

    /*
    Processes a Youtube playlist.
    @param {String} playlistId The ID of the Youtube playlist.
    */
    processPlaylist(msg, guild, playlistId) {
        const youtubeApiUrl = 'https://www.googleapis.com/youtube/v3/';

        getPlaylistInfo([], null).then(playlistItems => addToQueue(playlistItems))
            .catch(
                err => {
                    console.log(err);
                    guild.musicChannel.send(
                        `${tool.inaError} Gomen, I couldn't add your playlist to the queue. Try again later.`
                    )
                });

        /*
        A recursive function that retrieves the metadata (id and title) of each video in the playlist using the Youtube API.
        @param {Array} playlistItems Array storing metadata of each video in the playlist.
        @param {String} pageToken The next page token response for the playlist if applicable.
        @return {Promise} Resolved with playlist items if playlist metadata succesfully retrieved, rejected if not.
        */
        async function getPlaylistInfo(playlistItems, pageToken) {
            pageToken = pageToken ?
                `&pageToken=${pageToken}` :
                '';

            let options = {
                url: `${youtubeApiUrl}playlistItems?playlistId=${playlistId}${pageToken}&part=snippet&fields=nextPageToken,items(snippet(title,resourceId/videoId))&maxResults=50&key=${config.youtube_api_key}`
            }

            let body = await rp(options);
            let playlist = JSON.parse(body);
            playlistItems = playlistItems.concat(playlist.items.filter( //Concat all non-deleted videos.
                item => item.snippet.title != 'Deleted video'));

            if (playlist.hasOwnProperty('nextPageToken')) { //More videos in playlist.
                playlistItems = await getPlaylistInfo(playlistItems, playlist.nextPageToken);
            }

            return playlistItems;
        }

        /*
        Processes the playlist metadata, adding songs to the queue.
        @param {Array} playlistItems The metadata of each video in the playlist.
        */
        async function addToQueue(playlistItems) {
            let queueLength = guild.queue.length;

            for (let i = 0; i < playlistItems.length; i++) {
                let song = new Song(
                    playlistItems[i].snippet.title,
                    `https://www.youtube.com/watch?v=${playlistItems[i].snippet.resourceId.videoId}`,
                    'youtube');

                queueSong(msg, guild, song, i + queueLength);
            }
            let options = {
                url: `${youtubeApiUrl}playlists?id=${playlistId}&part=snippet&key=${config.youtube_api_key}`
            }

            //Get playlist title.
            try {
                let body = await rp(options);
                let playlistTitle = JSON.parse(body).items[0].snippet.title;
                guild.musicChannel.send(
                    `Enqueued ${tool.wrap(playlistItems.length)} songs from ${tool.wrap(playlistTitle)} requested by ${tool.wrap(msg.author.username + '#' + msg.author.discriminator)} ${tool.inaHappy}`
                );
            } catch (err) {
                console.log('Could not retrieve playlist title.');
                guild.musicChannel.send(
                    `Enqueued ${tool.wrap(playlistItems.length)} songs requested by ${tool.wrap(msg.author.username + '#' + msg.author.discriminator)} ${tool.inaHappy}`
                );
            }

            if (guild.status != 'playing') {
                playSong(msg, guild);
            }
        }
    },
}
