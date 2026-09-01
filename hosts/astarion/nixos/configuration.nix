# █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀ █░█ █▀█ ▄▀█ ▀█▀ █ █▀█ █▄░█
# █▄▄ █▄█ █░▀█ █▀░ █ █▄█ █▄█ █▀▄ █▀█ ░█░ █ █▄█ █░▀█

{
  self,
  inputs,
  lib,
  config,
  pkgs,
  musnix,
  light,
  ...
}:
let
  unstable = inputs.nixpkgs-unstable;
in
{

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
    networkmanager.enable = true;
    firewall.allowedTCPPorts = [ 22 ];
    firewall.allowedUDPPorts = [ 5353 ];

    # fixes no internet after mullvad vpn exit node
    # https://github.com/tailscale/tailscale/issues/10319
    firewall.checkReversePath = "loose";
  };

  services.resolved.enable = true;
  networking.networkmanager.dns = "systemd-resolved";

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
    kernelModules = [
      "snd-seq"
      "snd-rawmidi"
    ];
    blacklistedKernelModules = [
      "snd_pci_ps"
      "snd_rn_pci_acp3x"
      "snd_pci_acp3x"
    ];
    kernelParams = [
      "amdgpu.abm_level=0"
      "amdgpu.dcdebugmask=0x10"
      "snd_hda_intel.dmic_detect=0"
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
    pam.services.astal-auth = { };

    acme.acceptTerms = true;
    acme.defaults.email = "alexisgarado@gmail.com";

    sudo.extraRules = [
      {
        users = [ "alexis" ];
        commands = [
          {
            command = "/run/current-system/sw/bin/framework-tool";
            options = [ "NOPASSWD" ];
          }
        ];
      }
    ];
  };

  # Keyring
  services.gnome.gnome-keyring.enable = true;
  security.pam.services.greetd.enableGnomeKeyring = true;

  environment = {
    variables = {
      EDITOR = "nvim";
      VISUAL = "nvim";
    };

    sessionVariables = rec {
      ENCHIRIDION = "$HOME/Documents/Enchiridion";
      NVCFG = "$HOME/Github/dotfiles/modules/home/nvim/";
      DOTS = "$HOME/Github/dotfiles/hosts/astarion/";
      MUSIC = "$HOME/Music/Library/";
    };
  };

  sops = {
    defaultSopsFile = "${self}/secrets.yaml";
    age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ];
    secrets = {
      tailscale_key = {
        owner = "root";
      };
      gemini_api = {
        owner = "alexis";
        mode = "0400";
      };
      transit_api = {
        owner = "alexis";
        mode = "0400";
      };
      locationiq_api = {
        owner = "alexis";
        mode = "0400";
      };
      pushover_user = {
        owner = "alexis";
        mode = "0400";
      };
      pushover_api = {
        owner = "alexis";
        mode = "0400";
      };
      openweather_api = {
        owner = "alexis";
        mode = "0400";
      };
      gcalcli_oauth = {
        owner = "alexis";
        mode = "0400";
      };
      lastfm_user = {
        owner = "alexis";
        mode = "0400";
      };
      lastfm_pass = {
        owner = "alexis";
        mode = "0400";
      };
      light_email = {
        owner = "alexis";
        mode = "0400";
      };
      light_password = {
        owner = "alexis";
        mode = "0400";
      };
      light_device_id = {
        owner = "alexis";
        mode = "0400";
      };
    };
  };

  services.tailscale = {
    enable = true;
    authKeyFile = config.sops.secrets.tailscale_key.path;
    useRoutingFeatures = "client";
  };

  services.auriga-syncthing = {
    enable = true;
    user = "alexis";
    musicPath = /home/alexis/Music/Library;
    playlistPath = /home/alexis/Music/Playlists/cmus-playlist-defs/playlists;
    playlistMetaPath = /home/alexis/.config/labyrinthine/playlists;
    ledgerPath = /home/alexis/Documents/ledger/data;
  };

  # --------------------------------------------
  # SYSTEM PACKAGES
  # These will be installed for all users
  # --------------------------------------------

  # Explicitly specify allowed unfree packages
  nixpkgs.config.allowUnfreePredicate =
    pkg:
    builtins.elem (lib.getName pkg) [
      "steam"
      "steam-original"
      "steam-run"
      "steam-tui"
      "steam-unwrapped"
      "steamcmd"
      "reaper"
      "zoom"
      "waveforms"
      "adept2-runtime"
    ];

  environment.systemPackages = with pkgs; [
    light.packages.x86_64-linux.light-phone-cli-tui
    light.packages.x86_64-linux.light-phone-api

    signal-desktop

    xournalpp
    spotdl

    # DE/WM
    inputs.swww.packages.${pkgs.stdenv.hostPlatform.system}.swww
    unstable.legacyPackages."${pkgs.stdenv.hostPlatform.system}".hyprpicker # v0.4.2
    brightnessctl
    playerctl
    wl-clipboard
    libnotify

    # Essentials
    framework-tool
    ripgrep
    zip
    unzip
    wget
    lf
    mpv
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
    hledger
    reckon
    cava
    tree

    # TUI
    youtube-tui
    steam-tui
    taskwarrior-tui

    # Utilities and monitoring
    htop
    btop
    radeontop
    acpi
    grimblast
    obs-studio
    exiftool

    # Embedded dev (C/C++)
    libgccjit
    gcc_multi
    clang-tools
    gdb
    gnumake
    valgrind
    kicad

    # JS dev
    nodejs_22
    nodePackages.typescript

    # Go dev
    go
    hugo

    # Python dev
    poetry
    (python311.withPackages (
      ps: with ps; [
        pyyaml
      ]
    ))

    # Misc
    yt-dlp
    id3v2
    cmus
    cmusfm # Music library
    pkgs.python311Packages.mutagen # Or another desired Python version, e.g., python312Packages.mutagen
    libimobiledevice
    ifuse # iPhone mounting

    # Guitar
    guitarix
    qjackctl
    libjack2
    jack2
    jack_capture
    tuxguitar
    lmms

    # Gaming
    steamcmd
    prismlauncher

    # *gag*
    wineWowPackages.stable

    inputs.zen-browser.packages."${system}".default
  ];

  musnix.enable = true;

  # FlatPak
  services.flatpak.enable = true;
  xdg.portal.enable = true;
  xdg.portal.extraPortals = [
    pkgs.xdg-desktop-portal-hyprland
    pkgs.xdg-desktop-portal-gtk
  ];
  xdg.portal.config.common.default = "*";

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
      package = unstable.legacyPackages."${pkgs.system}".pipewire;
      wireplumber.package = unstable.legacyPackages."${pkgs.system}".wireplumber;
      alsa = {
        enable = true;
        support32Bit = true;
      };
      pulse.enable = true;
      wireplumber.enable = true;
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
      listen = [
        {
          addr = "127.0.0.1";
          port = 8080;
        }
      ];
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
    git = {
      enable = true;
      lfs.enable = true;
    };

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
