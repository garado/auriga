# █░█ █▀█ █▀▄▀█ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
# █▀█ █▄█ █░▀░█ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄

# Home manager configuration for astarion (FW13).

{
  self,
  inputs,
  lib,
  config,
  pkgs,
  pkgs-2505,
  ...
}:
{

  imports = [
    ./zsh
  ];

  # Explicitly define allowed unfree packages
  nixpkgs.config.allowUnfreePredicate =
    pkg:
    builtins.elem (lib.getName pkg) [
      "obsidian"
    ];

  home = {
    username = "alexis";

    homeDirectory = "/home/alexis";

    packages = with pkgs; [
      # Labyrinthine
      (pkgs.writeShellScriptBin "labyrinthine" ''
        cd "$HOME/Github/labyrinthine"

        # If binary already exists, enter devshell and run it. Otherwise, enter devshell, compile, then run
        if [[ -x "./build/labyrinthine" ]]; then
          exec nix develop --command ./build/labyrinthine
        else
          exec nix develop --command bash -c "cmake -B build && cmake --build build && ./build/labyrinthine"
        fi
      '')

      (pkgs.writeShellScriptBin "labyrinthine-ctl" ''
        cd "$HOME/Github/labyrinthine"

        if [[ -x "./build/labyrinthine-ctl" ]]; then
          exec ./build/labyrinthine-ctl "$@"
        else
          exec nix develop --command bash -c "cmake -B build && cmake --build build && ./build/labyrinthine-ctl $*"
        fi
      '')

      # Music
      mpc

      # Productivity
      obsidian

      (python3.withPackages (
        ps: with ps; [
          # Packages from nixpkgs
          pynvim
          pip

          # Build a package from PyPI
          # (buildPythonPackage rec {
          #   pname = "quote";
          #   version = "3.0";
          #   src = fetchPypi {
          #     inherit pname version;
          #     sha256 = "06873dfed9200cb2e88f98c562080938b42c88d4a37dcf89542cff3a210b6287";
          #   };
          #   # Add any build inputs required by your package
          #   buildInputs = [];
          # })

          # (buildPythonPackage rec {
          #   pname = "gazpacho";
          #   version = "1.1";
          #   src = fetchPypi {
          #     inherit pname version;
          #     sha256 = "1579c1be2de05b5ded0a97107b179d12491392fb095aeab185b283ea48cd7010";
          #   };
          # })

        ]
      ))

    ];

    pointerCursor = {
      gtk.enable = true;
      x11.enable = true;
      package = pkgs.bibata-cursors;
      name = "Bibata-Modern-Classic";
      size = 24;
    };
  };

  gtk = {
    enable = true;
    cursorTheme = {
      name = "Bibata-Modern-Classic";
      package = pkgs.bibata-cursors;
    };
    font.name = "Karla";
    font.size = 14;
  };

  programs.ledger = {
    enable = true;
    settings = {
      file = "~/Enchiridion/self/ledger/2024/2024.ledger";
    };
  };

  services.gammastep = {
    enable = true;
    provider = "manual";
    latitude = 37.5485;
    longitude = -121.9886;
  };

  services.mpd = {
    enable = true;
    musicDirectory = "/home/alexis/Music/Library";
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
    mpdMusicDir = "/home/alexis/Music/Library";
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

  # Hyprland: host-specific display and startup config
  wayland.windowManager.hyprland.settings = {
    monitor = [
      "DP-11,1920x1080@75.00200,0x0,1"
      "eDP-1,2256x1504@59.99900,0x1080,1"
    ];
    exec-once = [
      "sleep 1 && swww-daemon &"
      "labyrinthine &"
    ];
    cursor = {
      no_warps = false;
      warp_on_change_workspace = true;
      default_monitor = "eDP-1";
    };
  };

  # Kitty: astarion-specific sessions
  xdg.configFile."kitty/sessions".source = ./kitty/sessions;

  # Let home-manager install and manage itself
  programs.home-manager = {
    enable = true;
  };

  # Nicely reload system units when changing configs
  systemd.user.startServices = "sd-switch";

  # home-manager version
  home.stateVersion = "24.11";
}
