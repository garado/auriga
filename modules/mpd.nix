# █▀▄▀█ █▀█ █▀▄
# █░▀░█ █▀▀ █▄▀

# sets up:
# - music player daemon (mpd)
# - mpd/mpris bridge, so existing mpris controls can control mpd (mpdris2)
# - music player (ncmpcpp)
# - last.fm scrobbling from mpd (mpdscribble)

{
  flake.modules.nixos.mpd = {
    sops.secrets.lastfm_pass = {
      owner = "alexis";
      mode = "0400";
    };
  };

  flake.modules.homeManager.mpd =
    { pkgs, ... }:
    {
      home.packages = [ pkgs.mpc ];

      services.mpd = {
        enable = true;
        musicDirectory = "/home/alexis/Music/Library"; # TODO per-host config option for these
        playlistDirectory = "/home/alexis/Music/Playlists/cmus-playlist-defs/playlists";
        extraConfig = ''
          audio_output {
            type "pipewire"  # or "pulse" depending on your audio
            name "PipeWire Output"
          }
        '';
      };

      services.mpdris2.enable = true; # mpris <-> mpd bridge

      programs.ncmpcpp = {
        enable = true;
        mpdMusicDir = "/home/alexis/Music/Library"; # TODO per-host config option for this
        settings = {
          mpd_host = "localhost";
          mpd_port = 6600;
        };

        bindings = [
          {
            key = "j";
            command = "scroll_down";
          }
          {
            key = "k";
            command = "scroll_up";
          }
          {
            key = "h";
            command = "previous_column";
          }
          {
            key = "l";
            command = "next_column";
          }
          {
            key = "ctrl-u";
            command = "page_up";
          }
          {
            key = "ctrl-d";
            command = "page_down";
          }
          {
            key = "g";
            command = "move_home";
          }
          {
            key = "G";
            command = "move_end";
          }
          {
            key = "/";
            command = "find";
          }
          {
            key = "n";
            command = "next_found_item";
          }
          {
            key = "N";
            command = "previous_found_item";
          }
        ];
      };

      # Enable last.fm scrobbling from mpd
      services.mpdscribble = {
        enable = true;
        endpoints = {
          "last.fm" = {
            username = "gyar-ados";
            passwordFile = "/run/secrets/lastfm_pass";
          };
        };
      };
    };
}
