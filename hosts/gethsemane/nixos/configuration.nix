
# █▀▀ █▀▀ ▀█▀ █░█ █▀ █▀▀ █▀▄▀█ ▄▀█ █▄░█ █▀▀
# █▄█ ██▄ ░█░ █▀█ ▄█ ██▄ █░▀░█ █▀█ █░▀█ ██▄

# Nix config for gethsemane (home server).

{ self, config, pkgs, lib, inputs, nixpkgs-unstable, ... }:
let
  pkgs-unstable = import nixpkgs-unstable {
    system = pkgs.system;
    config.allowUnfree = true;
  };
in
{
  imports = [
    ./hardware-configuration.nix
    ../../../modules/syncthing
    ../../../modules/selfhosted/dawarich
    inputs.sops-nix.nixosModules.sops
  ];

  # Misc Nix settings
  nix.settings = {
    experimental-features = "nix-command flakes";
    auto-optimise-store = true;
  };

  users.users.vessel = {
    isNormalUser = true;
    description = "vessel";
    extraGroups = [ "networkmanager" "wheel" ];
    packages = with pkgs; [
      compose2nix
      sops
      restic
      immich-cli immich-go
      qbittorrent-nox
      pkgs-unstable.silverbullet
    ];
  };
    
  users.users.vessel.shell = pkgs.zsh;
  programs.zsh.enable = true;

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Networking and ssh access
  networking.hostName = "gethsemane";
  networking.firewall.allowedTCPPorts = [
    22 2283 443 8443 80
    3000 # enchiridion
  ];
  networking.firewall.allowedUDPPorts = [ 5353 ];
  networking.firewall.checkReversePath = "loose";

  services.openssh = {
    enable = true;
    settings = {
      PermitRootLogin = "no";
      PasswordAuthentication = true; # TODO set to false after ssh
    };
    ports = [ 22 ];
  };
  networking.networkmanager.enable = true;

  security.acme = {
    acceptTerms = true;
    defaults.email = "alexisgarado@gmail.com";
  };

  # Access with `ssh vessel@gethsemane`
  services.avahi = {
    enable = true;
    nssmdns4 = true;
    publish = {
      enable = true;
      addresses = true;
      workstation = true;
    };
  };

  # No sleeping
  services.logind.settings.Login = {
    HandleLidSwitch = "ignore";
    HandleLidSwitchExternalPower = "ignore";
    HandleLidSwitchDocked = "ignore";
  };

  # Power management
  powerManagement.enable = true;
  services.thermald.enable = true;

  # Super secret secrets
  sops = {
    defaultSopsFile = "${self}/secrets.yaml";
    age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ];

    secrets = {
      tailscale_key = { owner = "root"; };
      restic_pass   = { owner = "root"; };
      b2_env        = { owner = "root"; };
    };
  };

  # VPN
  services.tailscale = {
    enable = true;
    authKeyFile = config.sops.secrets.tailscale_key.path;
    useRoutingFeatures = "client";
  };

  # Google Photos alternative
  services.immich = {
    enable = true;
    mediaLocation = "/var/lib/immich";
    host = "0.0.0.0"; # needed for tailscale access
  };

  # Home inventory management
  services.homebox = {
    enable = true;
    package = pkgs-unstable.homebox;
    settings = {
      HBOX_WEB_MAX_UPLOAD_SIZE = "10";
      HBOX_OPTIONS_ALLOW_REGISTRATION = "true";
    };
  };
  
  systemd.services.homebox.environment.TMPDIR = "/var/lib/homebox/tmp";

  services.jellyfin = {
    enable = true;
    openFirewall = true;
  };

  # Cloud backups
  services.restic.backups = {
    daily-cloud = {
      initialize = true;
      repository = "b2:gethsemane";
      passwordFile = config.sops.secrets.restic_pass.path;
      environmentFile = config.sops.secrets.b2_env.path;

      paths = [
        "/var/Vault/"
      ];

      timerConfig = {
        OnCalendar = "03:00";
        Persistent = true;
      };

      pruneOpts = [
        "--keep-daily 7"
        "--keep-weekly 4"
        "--keep-monthly 6"
      ];
    };

    daily-blackreach = {
      initialize = true;
      repository = "/mnt/blackreach/Vault";
      passwordFile = config.sops.secrets.restic_pass.path;

      paths = [
        "/var/Vault/"
      ];

      timerConfig = {
        OnCalendar = "02:00";
        Persistent = true;
      };

      pruneOpts = [
        "--keep-daily 7"
        "--keep-weekly 4"
        "--keep-monthly 6"
      ];
    };
  };

  # Sync files between devices
  services.auriga-syncthing = {
    enable = true;
    user = "vessel";
    musicPath = /var/Vault/Music/Library;
    playlistPath = /var/Vault/Music/Playlists;
    playlistMetaPath = /var/Vault/Music/PlaylistMetadata;
    ledgerPath = /var/Vault/Ledger;
  };

  # Local storage
  fileSystems = {
    # WD 5TB Elements Portable (WDBU6Y0050BBK-WESN) 2022-03
    "/mnt/blackreach" = {
      device = "/dev/disk/by-label/blackreach";
      fsType = "ntfs3";
      options = [ "defaults" "nofail" "x-systemd.device-timeout=5s" ];
    };
  };

  # https://nixos.wiki/wiki/FAQ/When_do_I_update_stateVersion
  system.stateVersion = "25.11";
}
