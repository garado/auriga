
# █░█ █▀█ █▀▄▀█ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
# █▀█ █▄█ █░▀░█ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄

# User-specific configurations.

{ self, inputs, lib, config, pkgs, pkgs-2505, ... }: {

  imports = [
    # Defined in flake.nix
    inputs.ags.homeManagerModules.default

    # Import other pieces of config
    ./gtk
    ./hyprland
    ./kitty
    ./lf
    ./nvim
    # ./qutebrowser
    ./taskwarrior
    ./zsh
  ];

  # Explicitly define allowed unfree packages
  nixpkgs.config.allowUnfreePredicate = pkg: builtins.elem (lib.getName pkg) [
    "obsidian"
  ];

  home = {
    username = "alexis";

    homeDirectory = "/home/alexis";

    packages = with pkgs; [
      # Music
      ncspot mpc

      # Productivity
      obsidian

      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.io

      (python3.withPackages (ps: with ps; [
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

      ]))

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


  programs.ags = {
    enable = true;

    # symlinked to ~/.config/ags
    configDir = ./shell/ags-ts;

    extraPackages = with pkgs-2505; [
      gtksourceview5 libpng /** Source code */
      libshumate /** Provides map widget for dashboard transit tab */
      gvfs imagemagick /** Cover art utils for media player */
      gtk-session-lock /** For lockscreen (written with gtk3) */
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.apps
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.auth
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.battery
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.bluetooth
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.cava
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.greet
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.hyprland
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.mpris
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.network
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.notifd
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.powerprofiles
      inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.wireplumber
    ];
  };

  programs.git = {
    enable = true;
    settings = {
      user.name = "garado";
      user.email = "alexisgarado@gmail.com";
      core.quotepath = false;
      i18n.commitencoding = "utf-8";
      i18n.logoutputencoding = "utf-8";
    };
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
    settings = {
      mpd_host = "localhost";
      mpd_port = 6600;
      mpd_music_dir = "/home/alexis/Music/Library";
    };

    bindings = [
      { key = "j"; command = "scroll_down"; }
      { key = "k"; command = "scroll_up"; }
      { key = "h"; command = "previous_column"; }
      { key = "l"; command = "next_column"; }
      { key = "ctrl-u"; command = "page_up"; }
      { key = "ctrl-d"; command = "page_down"; }
      { key = "g"; command = "move_home"; }
      { key = "G"; command = "move_end"; }
      { key = "/"; command = "find"; }
      { key = "n"; command = "next_found_item"; }
      { key = "N"; command = "previous_found_item"; }
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

  # Let home-manager install and manage itself
  programs.home-manager = {
    enable = true;
  };

  # Nicely reload system units when changing configs
  systemd.user.startServices = "sd-switch";

  # home-manager version
  home.stateVersion = "24.11";
}
