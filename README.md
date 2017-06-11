# Inazuma Bot

A personal Discord bot written using discord.js.

Includes anime lookup and a music player.

# Commands

```
~help [command]
    Brings up the command page. Pass a command for further information.
```

```
~airing [options]   
    Displays the countdowns for anime in the airing list.  
    
    Options:      -a <anilist anime url> : Adds the given anime to the airing list.      
                  -r <name in list>      : Removes the anime from the airing list.     
                  -c                     : Clears the airing list.

~anilist <anime name>   
    Displays an anime's data, pulled from Anilist. 
    If multiple choices are given, simply reply with the number.
      
    alt: ~ani
```

```
~choose <arg1> | [arg2] ...
    Randomly chooses between the provided choice(s).

~roll <int1> [int2]   
    Rolls an integer from 1 to int1 inclusive.
    If int2 is given, rolls an integer between int1 and int2 inclusive.
```

```
~play <url>   
    Adds the song to the queue.

~skip
    Skips the current song.

~queue
    Displays the song queue.
```

```
~andy [@mention]   
    Shut up weeb. Mentions user, if included.

~gavquote
    Returns a random Gavin quote.

~vigne   
    Returns a random picture of Vigne.
```

```
~cc <voice channel> <@mention>
    Changes the mentioned user's voice channel to the given channel.
```



