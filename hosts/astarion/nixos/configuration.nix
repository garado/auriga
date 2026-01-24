
# █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀ █░█ █▀█ ▄▀█ ▀█▀ █ █▀█ █▄░█
# █▄▄ █▄█ █░▀█ █▀░ █ █▄█ █▄█ █▀▄ █▀█ ░█░ █ █▄█ █░▀█

# Replaces /etc/nixos/configuration.nix

{ self, inputs, lib, config, pkgs, musnix, ... }: 
let
  unstable = inputs.nixpkgs-unstable;
in {
  
  # --------------------------------------------
  # OVERLAYS
  # --------------------------------------------

  nixpkgs = { 
    overlays = [
      (final: prev: {
        nvchad = inputs.nix4nvchad.packages."${pkgs.system}".nvchad;
      })
    ];
  };

  # --------------------------------------------
  # BASIC SYSTEM CONFIGURATION
  # --------------------------------------------

  imports = [
    ../../../modules/syncthing
    ./hardware-configuration.nix
    ./fonts.nix
    inputs.sops-nix.nixosModules.sops
  ];

  # Networking
  networking = {
    hostName = "astarion";
    firewall.allowedTCPPorts = [ 22 ];
    firewall.allowedUDPPorts = [ 5353 ];
    networkmanager.enable = true;

    hosts = {
      # Temp fix for upstream librespot issues causing ncspot to stop working
      # https://github.com/hrkfdn/ncspot/issues/1676#issuecomment-3168197941
      "0.0.0.0" = ["apresolve.spotify.com"];
    };
  };

  # Enable mdns
  services.avahi = {
    enable = true;
    nssmdns4 = true;
    publish = {
      enable = true;
      addresses = true;
      workstation = true;
    };
  };

  # Hardware
  hardware = {
    bluetooth = {
      enable = true;
      powerOnBoot = true;
      settings = {
        General = {
          Enable = "Source,Sink,Media,Socket";
          Experimental = true;
        };
      };
    };
  };

  # Bootloader
  boot = {
    loader.systemd-boot.enable = true;
    kernelModules = [ "snd-seq" "snd-rawmidi" ];
    kernelParams = [
      "amdgpu.abm_level=0" 
      "amdgpu.dcdebugmask=0x10"
    ];
  };

  # Miscellaneous settings
  nix.settings = {
    experimental-features = "nix-command flakes";

    # Deduplicate and optimize nix store
    auto-optimise-store = true;
  };

  # https://nixos.wiki/wiki/FAQ/When_do_I_update_stateVersion
  system.stateVersion = "24.11";

  virtualisation.docker.enable = true;

  security = {
    rtkit.enable = true;
    pam.services.astal-auth = {};
  
    acme.acceptTerms = true;
    acme.defaults.email = "alexisgarado@gmail.com";

    sudo.extraRules = [{
      users = [ "alexis" ];
      commands = [{
        command = "/run/current-system/sw/bin/framework-tool";
        options = [ "NOPASSWD" ];
      }];
    }];
  };

  environment = {
    variables = {
        EDITOR = "nvim";
        VISUAL = "nvim";
    };

    sessionVariables = rec {
      ENCHIRIDION = "$HOME/Enchiridion";
      AGSCFG = "$HOME/Github/dotfiles/hosts/astarion/home/shell/ags-ts/";
      NVCFG = "$HOME/Github/dotfiles/hosts/astarion/home/nvim/nvchad-custom/";
      DOTS = "$HOME/Github/dotfiles/hosts/astarion/";
      MUSIC = "$HOME/Music/Library/";
    };
  };

  sops = {
    defaultSopsFile = "${self}/secrets.yaml";
    age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ];
    secrets = {
      tailscale_key   = { owner = "root"; };
      gemini_api      = { owner = "alexis"; mode = "0400"; };
      transit_api     = { owner = "alexis"; mode = "0400"; };
      locationiq_api  = { owner = "alexis"; mode = "0400"; };
      pushover_user   = { owner = "alexis"; mode = "0400"; };
      pushover_api    = { owner = "alexis"; mode = "0400"; };
      openweather_api = { owner = "alexis"; mode = "0400"; };
      gcalcli_oauth   = { owner = "alexis"; mode = "0400"; };
      lastfm_user     = { owner = "alexis"; mode = "0400"; };
      lastfm_pass     = { owner = "alexis"; mode = "0400"; };
    };
  };

  services.tailscale = {
    enable = true;
    authKeyFile = config.sops.secrets.tailscale_key.path;
  };

  services.auriga-syncthing = {
    enable = true;
    user = "alexis";
    musicPath = /home/alexis/Music/Library;
  };
  
  # --------------------------------------------
  # SYSTEM PACKAGES
  # These will be installed for all users
  # --------------------------------------------

  # Explicitly specify allowed unfree packages
  nixpkgs.config.allowUnfreePredicate = pkg: builtins.elem (lib.getName pkg) [
    "steam"
    "steam-original"
    "steam-run"
    "steam-tui"
    "steam-unwrapped"
    "steamcmd"
    "reaper"
    "zoom"
    "waveforms" "adept2-runtime"
  ];

  environment.systemPackages = with pkgs; [
    signal-desktop

    # DE/WM
    inputs.swww.packages.${pkgs.stdenv.hostPlatform.system}.swww
    unstable.legacyPackages."${pkgs.stdenv.hostPlatform.system}".hyprpicker # v0.4.2
    brightnessctl playerctl
    wl-clipboard
    libnotify

    # Essentials
    framework-tool
    ripgrep zip unzip wget lf mpv
    firefox
    gthumb
    imagemagick
    zathura
    gimp
    wireplumber
    sox
    audacity
    zoom-us
    ffmpeg
    shotcut
    obs-studio
    sops

    # GNOME extensions
    gnomeExtensions.bluetooth-battery
    gnomeExtensions.bluetooth-battery-meter

    # Terminal
    kitty
    vim

    # CLI tools
    unstable.legacyPackages."${pkgs.stdenv.hostPlatform.system}".gcalcli
    hledger reckon
    cava
    tree

    # TUI
    youtube-tui steam-tui taskwarrior-tui

    # Utilities and monitoring
    htop btop radeontop acpi
    grimblast obs-studio
    exiftool

    # Embedded dev (C/C++)
    libgccjit gcc_multi clang-tools gdb gnumake valgrind
    kicad

    # JS dev
    nodejs_22 nodePackages.typescript

    # Go dev
    go hugo

    # Python dev
    poetry
    (python311.withPackages (ps: with ps; [
      pyyaml
    ]))


    # Misc
    yt-dlp id3v2 cmus cmusfm # Music library
    pkgs.python311Packages.mutagen # Or another desired Python version, e.g., python312Packages.mutagen
    libimobiledevice ifuse  # iPhone mounting

    # Guitar
    guitarix qjackctl libjack2 jack2 jack_capture

    # Gaming
    steamcmd
    prismlauncher

    # *gag*
    wineWowPackages.stable
  ];

  musnix.enable = true;

  # FlatPak
  services.flatpak.enable = true;
  xdg.portal.enable = true;
  xdg.portal.extraPortals = [ pkgs.xdg-desktop-portal-gtk ];

  # --------------------------------------------
  # SYSTEM SERVICES
  # --------------------------------------------

  services = {
    automatic-timezoned.enable = true;
  
    tumbler.enable = true;

    power-profiles-daemon.enable = true;

    gvfs.enable = true;

    upower.enable = true;

    pipewire = {
      enable = true;
      alsa = {
        enable = true;
        support32Bit = true;
      };
      pulse.enable = true;
      wireplumber.enable = false;
    };

    xserver = {
      enable = true;
    };

    # Connecting iPhone
    usbmuxd = {
      enable = true;
      package = pkgs.usbmuxd2; # @TODO
    };

    greetd = {
      enable = true;
      settings = {
        default_session = {
          command = "${pkgs.tuigreet}/bin/tuigreet --time --cmd Hyprland";
          user = "greeter";
        };
      };
    };

    nginx.virtualHosts."localhost" = {
      listen = [{ addr = "127.0.0.1"; port = 8080; }];
    };

    logind = {
      settings = {
        Login = {
          handleLidSwitch = "suspend";
          extraConfig = ''
            IdleAction=suspend
            IdleActionSec=10min
            '';
        };
      };
    };
  };

  systemd.services = {
    lock-on-sleep = {
      description = "Lock screen before sleep";
      before = [ "sleep.target" ];
      wantedBy = [ "sleep.target" ];
      serviceConfig = {
        Type = "oneshot";
        User = "alexis";
        ExecStart = "/etc/profiles/per-user/alexis/bin/astal -i lock lock"; # @TODO install systemwide
      };
      environment = {
        WAYLAND_DISPLAY = "wayland-1";
        XDG_RUNTIME_DIR = "/run/user/1000";
      };
    };
  };

  # --------------------------------------------
  # PROGRAMS
  # --------------------------------------------

  programs = {
    git.enable = true;
    hyprland.enable = true;
    thunar.enable = true;
    zsh.enable = true;

    steam = {
      enable = true;
      dedicatedServer.openFirewall = true;
    };
  };

  # --------------------------------------------
  # USER CONFIGURATION
  # --------------------------------------------

  users = {
    defaultUserShell = pkgs.zsh;

    users = {
      alexis = {
        initialPassword = "password";
        isNormalUser = true;
        extraGroups = [
          "wheel"
          "networkmanager" 
          "audio"
          "docker"
        ];
      };

    };
  };
}
