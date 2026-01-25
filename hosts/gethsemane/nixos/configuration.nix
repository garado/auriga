{ self, config, pkgs, inputs, ... }:

{
  imports = [
    ./hardware-configuration.nix
    ../../../modules/syncthing
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
      sops
      restic
      immich-cli immich-go
    ];
  };

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Networking and ssh access
  networking.hostName = "gethsemane";
  networking.firewall.allowedTCPPorts = [ 22 2283 ];
  networking.firewall.allowedUDPPorts = [ 5353 ];
  services.openssh = {
    enable = true;
    settings = {
      PermitRootLogin = "no";
      PasswordAuthentication = true; # TODO set to false after ssh
    };
    ports = [ 22 ];
  };
  networking.networkmanager.enable = true;

  # Access with `ssh@vessel.gethsemane`
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
  services.logind = {
    lidSwitch = "ignore";
    lidSwitchExternalPower = "ignore";
    lidSwitchDocked = "ignore";
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
  };

  services.immich = {
    enable = true;
    mediaLocation = "/var/lib/immich";
    host = "0.0.0.0"; # needed for tailscale access
  };

  # Cloud backups
  services.restic.backups = {
    daily-cloud = {
      initialize = true;
      repository = "b2:gethsemane";
      passwordFile = config.sops.secrets.restic_pass.path;
      environmentFile = config.sops.secrets.b2_env.path;

      paths = [
        "/home/vessel/Vault/"
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
        "/home/vessel/Vault"
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
    musicPath = /home/vessel/Vault/Music/Library;
    playlistPath = /home/vessel/Vault/Music/Playlists;
    playlistMetaPath = /home/vessel/Vault/Music/PlaylistMetadata;
    ledgerPath = /home/vessel/Vault/Ledger;
  };

  # Local storage
  fileSystems = {
    # WD 5TB Elements Portable (WDBU6Y0050BBK-WESN) 2022-03
    "/mnt/blackreach" = {
      device = "/dev/disk/by-label/blackreach";
      fsType = "ntfs3";
      options = [ "defaults" ];
    };
  };
}
