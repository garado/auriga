
# █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀ █░█ █▀█ ▄▀█ ▀█▀ █ █▀█ █▄░█
# █▄▄ █▄█ █░▀█ █▀░ █ █▄█ █▄█ █▀▄ █▀█ ░█░ █ █▄█ █░▀█

# Replaces /etc/nixos/configuration.nix

{ inputs, lib, config, pkgs, musnix, ... }: 
let
  unstable = inputs.nixpkgs-unstable;
in {

  # --------------------------------------------
  # BASIC SYSTEM CONFIGURATION
  # --------------------------------------------

  imports = [
    ./hardware-configuration.nix
    ./fonts.nix
  ];

  # Networking
  networking = {
    hostName = "astarion";
    networkmanager.enable = true;

    hosts = {
      # Temp fix for upstream librespot issues causing ncspot to stop working
      # https://github.com/hrkfdn/ncspot/issues/1676#issuecomment-3168197941
      "0.0.0.0" = ["apresolve.spotify.com"];
    };
  };

  # Hardware
  hardware = {
    bluetooth = {
      enable = true;
      powerOnBoot = true;
      settings = {
        General = {
          Experimental = true;
        };
      };
    };
  };

  # Bootloader
  boot = {
    loader.systemd-boot.enable = true;
    kernelModules = [ "snd-seq" "snd-rawmidi" ];
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
    # DE/WM
    inputs.swww.packages.${pkgs.system}.swww
    unstable.legacyPackages."${pkgs.system}".hyprpicker # v0.4.2
    brightnessctl playerctl
    wl-clipboard
    libnotify

    # Essentials
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

    # GNOME extensions
    gnomeExtensions.bluetooth-battery
    gnomeExtensions.bluetooth-battery-meter

    # Terminal
    kitty
    vim

    # CLI tools
    unstable.legacyPackages."${pkgs.system}".gcalcli
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
    python3 poetry

    # Misc
    libimobiledevice ifuse  # iPhone mounting

    # Guitar
    guitarix qjackctl libjack2 jack2 jack_capture

    # Gaming
    steamcmd
    prismlauncher

    # *gag*
    wineWowPackages.stable
  ];

  security.rtkit.enable = true;
  services.pipewire = {
    enable = true;
    alsa = {
      enable = true;
      support32Bit = true;
    };
    pulse.enable = true;
    wireplumber.enable = false;
  };
    
  musnix.enable = true;

  services.tumbler.enable = true;

  environment.variables = {
    EDITOR = "nvim";
    VISUAL = "nvim";
  };

  environment.sessionVariables = rec {
    ENCHIRIDION = "$HOME/Enchiridion";
    AGSCFG = "$HOME/Github/dotfiles/hosts/astarion/home/services/ags/";
    NVCFG = "$HOME/Github/dotfiles/hosts/astarion/home/programs/nvim/nvchad-custom/";
    DOTS = "$HOME/Github/dotfiles/hosts/astarion/";
  };

  
  # --------------------------------------------
  # SYSTEM SERVICES
  # --------------------------------------------

  security.acme.acceptTerms = true;
  security.acme.defaults.email = "alexisgarado@gmail.com";


  services = {
    automatic-timezoned.enable = true;

    power-profiles-daemon.enable = true;

    gvfs.enable = true;

    upower.enable = true;

    xserver = {
      enable = true;
      displayManager.gdm.enable = true; # @TODO
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
          command = "${pkgs.greetd.tuigreet}/bin/tuigreet --time --cmd Hyprland";
          user = "greeter";
        };
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
