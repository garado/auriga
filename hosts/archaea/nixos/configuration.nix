
# ▄▀█ █▀█ █▀▀ █░█ ▄▀█ █▀▀ ▄▀█
# █▀█ █▀▄ █▄▄ █▀█ █▀█ ██▄ █▀█

# Surface Go 2

{ self, inputs, lib, config, pkgs, ... }:
{
  imports = [
    ../../../modules/syncthing
    ./hardware-configuration.nix
    inputs.sops-nix.nixosModules.sops
  ];

  # --------------------------------------------
  # BASIC SYSTEM CONFIGURATION
  # --------------------------------------------

  networking = {
    hostName = "archaea";
    networkmanager.enable = true;
    firewall.allowedTCPPorts = [ 22 ];
    firewall.allowedUDPPorts = [ 5353 ];
  };

  services.resolved.enable = true;
  networking.networkmanager.dns = "systemd-resolved";

  services.avahi = {
    enable = true;
    nssmdns4 = true;
    publish = {
      enable = true;
      addresses = true;
      workstation = true;
    };
  };

  hardware.bluetooth = {
    enable = true;
    powerOnBoot = true;
    settings.General = {
      Enable = "Source,Sink,Media,Socket";
      Experimental = true;
    };
  };

  boot = {
    loader.systemd-boot.enable = true;
    loader.efi.canTouchEfiVariables = true;
  };

  nix.settings = {
    experimental-features = "nix-command flakes";
    auto-optimise-store = true;
  };

  security = {
    rtkit.enable = true;
    pam.services.astal-auth = {};
    pam.services.greetd.enableGnomeKeyring = true;
  };

  services.gnome.gnome-keyring.enable = true;

  environment = {
    variables = {
      EDITOR = "nvim";
      VISUAL = "nvim";
    };
    sessionVariables = {
      NVCFG = "$HOME/Github/dotfiles/modules/home/nvim/";
      DOTS = "$HOME/Github/dotfiles/hosts/archaea/";
    };
  };

  sops = {
    defaultSopsFile = "${self}/secrets.yaml";
    age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ];
    secrets = {
      tailscale_key   = { owner = "root"; };
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
  };

  nixpkgs.config.allowUnfreePredicate = pkg: builtins.elem (lib.getName pkg) [];

  # --------------------------------------------
  # SYSTEM PACKAGES
  # --------------------------------------------

  environment.systemPackages = with pkgs; [
    # DE/WM
    inputs.swww.packages.${pkgs.stdenv.hostPlatform.system}.swww
    brightnessctl playerctl
    wl-clipboard
    libnotify

    # Essentials
    ripgrep zip unzip wget lf mpv
    firefox
    imagemagick
    zathura
    ffmpeg
    sops
    xournalpp drawing

    # Terminal
    kitty
    vim

    # CLI tools
    tree

    # Utilities
    htop btop acpi
    grimblast
  ];

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
      wireplumber.enable = true;
    };

    xserver.enable = true;

    greetd = {
      enable = true;
      settings.default_session = {
        command = "${pkgs.tuigreet}/bin/tuigreet --time --cmd Hyprland";
        user = "greeter";
      };
    };

    logind.settings.Login = {
      handleLidSwitch = "suspend";
      extraConfig = ''
        IdleAction=suspend
        IdleActionSec=10min
      '';
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
  };

  xdg.portal.enable = true;
  xdg.portal.extraPortals = [ pkgs.xdg-desktop-portal-hyprland pkgs.xdg-desktop-portal-gtk ];
  xdg.portal.config.common.default = "*";

  # --------------------------------------------
  # USER CONFIGURATION
  # --------------------------------------------

  users = {
    defaultUserShell = pkgs.zsh;
    users.alexis = {
      initialPassword = "password";
      isNormalUser = true;
      extraGroups = [
        "wheel"
        "networkmanager"
        "audio"
      ];
    };
  };

  system.stateVersion = "23.11";
}
