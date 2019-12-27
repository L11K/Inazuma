module.exports = {
   descriptions: {
      help: `Brings up the help page.`,

      andy: `Shut up weeb.`,

      anilist: `Displays an anime's data, pulled from Anilist.`,

      cc: `Changes the mentioned user's voice channel to the given channel.`,

      choose: `Randomly chooses between the provided choices.`,

      gavquote: `Returns a random Gavin quote.`,

      prune: `Prunes messages in the channel it was used in.`,

      role: `Role management functions.`,

      roll: `Rolls a random number.`,

      music: `Music streaming functions.`,

      ban: `Bans the mentioned user.`,

      kick: `Kicks the mentioned user.`,

      weebify: `Translates a given sentence from English to Japanese.`,

      sar: `Self assignable roles interface`,

      roleme: `Assign/deassign self assignable roles from yourself.`
   },

   usages: {
      help: `
help [command]
   Brings up the command page. Pass a command for further information.`,

      andy: `
andy [mention]
   Shut up weeb. Mentions user, if included.`,

      airing: `
airing [function]
   Displays your airing list when used with no arguments.

   Functions:
      sync [anilist name]     : Sync your Anilist to your airing list.
                                Name is only required the first time.
                                This only syncs to be aired/airing anime.

The airing list shows the time until the next episode airs for each anime in your list.`,

      anilist: `
anilist | ~ani <anime name>
   Displays an anime's data, pulled from Anilist.
   If multiple choices are given, simply reply with the number.`,

      cc: `
cc <voice channel> <mention>
   Changes the mentioned user's voice channel to the given channel.`,

      choose: `
choose <arg1> | [arg2] ...
   Randomly chooses between the provided choice(s).`,

      gavquote: `
gavquote
   Returns a random Gavin quote.`,

      prune: `
prune <amount> [options]
   Prunes the last <amount> messages.

   Options:
      [--bots]            : Only prunes bot messages.
      [--user <name>]     : Only prunes messages by the specified user.
      [--filter <string>] : Only prunes messages with the specified string.

      [--pinned | -p]     : Also prunes pinned messages.
      [--silent | -s]     : Deletes command and doesn't display results.`,

      role: `[Role Help]

role give <role[,...]> [options] : Gives role(s).
role take <role[,...]> [options] : Removes role(s).
   [--bots]              : Only change roles for bots.
   [--users]             : Only change roles for users.
   [--user <user[,...]>] : Only change roles for specified users.

   [--inrole <role>]     : Change roles for everyone with the role.
   [--notinrole <role>]  : Change roles for everyone without the role.
   [--noroles]           : Change roles for everyone with no roles.

role modify <role> [options] : Modifies a role.
   [--name <name>]       : Rename role.
   [--color <color>]     : Change role color. (6 digit HEX)`,

      roll: `
roll <int1> [int2]
   Rolls an integer from 1 to int1 inclusive.
   If int2 is given, rolls an integer between int1 and int2 inclusive.`,

      music: `
[Music Help]

music | m <function>
   play <url> | <search> : Adds the song/playlist to the queue.
   skip                  : Skips the current song.
   pause                 : Pauses the song.
   resume                : Resumes the song.
   shuffle               : Shuffles the queue.

   queue                 : Displays the song queue.
   purge                 : Clears the song queue.
   np                    : Displays the title of the current song.

   vol <0-100>           : Sets volume.

   join                  : Joins your voice channel.
   leave                 : Leaves voice channel.

Requires a #music text channel.`,

      ban: `
ban <mention> [options]
   Bans the mentioned user.
   You cannot ban users in a role higher than Inazuma or yourself.

   Options:
      [--days <number>]   : Deletes the message history of the user.
      [--reason <reason>] : Specifies a reason for banning the user.`,

      kick: `
kick <mention> [options]
   Kicks the mentioned user.
   You cannot kick users in a role higher than Inazuma or yourself.

   Options:
      [--reason <reason>] : Specifies a reason for kicking the user.`,

      weebify: `
weebify <sentence>
   Translates a sentence from English to Japanese.`,

      sar: `
sar <function>
   add <role name>    : Add this SAR to the server.
   remove <role name> : Remove this SAR from the server.
   list               : List all SARs on this server.

   The self assignable roles interface.
   Use ~roleme <SAR> to self assign roles.`,

      'roleme': `
roleme <SAR>
  Assign/deassign self assignable roles from yourself.`
   }
};