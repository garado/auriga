# █▀▀ █▀▀ ▀█▀ █░█ █▀ █▀▀ █▀▄▀█ ▄▀█ █▄░█ █▀▀
# █▄█ ██▄ ░█░ █▀█ ▄█ ██▄ █░▀░█ █▀█ █░▀█ ██▄

# Lenovo IdeaPad Flex 5. Former daily driver, now home server.

{ config, inputs, ... }:
{
  flake.modules.nixos."hosts/gethsemane" =
    { pkgs, ... }:
    {
      # modules ---------------------------------------------------------------------
      imports = [
        ./_hardware-configuration.nix
        ./_machine-report.nix
      ]
      ++ (with config.flake.modules.nixos; [
        backup
        caddy
        cli-tools
        dawarich
        editor
        git
        home-manager
        homebox
        immich
        mdns
        networkmanager
        nfs-server
        nix-settings
        paperless
        silverbullet
        sops
        sshd
        syncthing
        tailscale
        tsdproxy
        unfree
        zsh
      ]);

      home-manager.users.vessel = {
        imports = with config.flake.modules.homeManager; [
          git
          ledger
          lf
          nvim
          zsh
        ];
      };
      # /modules --------------------------------------------------------------------

      # packages --------------------------------------------------------------------
      # /packages -------------------------------------------------------------------

      home-manager.users.vessel = {
        home.stateVersion = "24.11";

        # let home-manager manage/upgrade itself
        programs.home-manager.enable = true;

        # reload systemd user services more gracefully on rebuild
        systemd.user.startServices = "sd-switch";
      };

      services.openssh.settings.PrintLastLog = false;

      sops.age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ];
      services.tailscale.useRoutingFeatures = "client";

      services.auriga-syncthing = {
        enable = true;
        user = "vessel";
        musicPath = null;
        playlistPath = /srv/vault/Music/Playlists;
        playlistMetaPath = /srv/vault/Music/PlaylistMetadata;
        ledgerPath = /srv/vault/Ledger;
      };

      boot.loader.systemd-boot.enable = true;
      boot.loader.efi.canTouchEfiVariables = true;

      # HDD for nightly backups
      # WD 5TB Elements Portable (WDBU6Y0050BBK-WESN) 2022-03
      boot.supportedFilesystems = [ "ntfs" ];
      fileSystems."/mnt/blackreach" = {
        device = "/dev/disk/by-uuid/E45E388E5E385B8C";
        fsType = "ntfs3";
        options = [
          "nofail"
          "uid=0"
          "gid=0"
          "fmask=0177"
          "dmask=0077"
        ];
      };

      # server, no sleeping
      services.logind.settings.Login = {
        HandleLidSwitch = "ignore";
        HandleLidSwitchExternalPower = "ignore";
        HandleLidSwitchDocked = "ignore";
      };

      powerManagement.enable = true;
      services.thermald.enable = true;

      # rtl8822ce wifi drops connection periodically (dpk calibration errors
      # in dmesg). i pray to god this fixes it
      boot.kernelParams = [ "pcie_aspm=off" ];
      boot.extraModprobeConfig = ''
        options rtw88_core disable_lps_deep=1
      '';

      # TODO: qbittorrent-nox -> arr.nix, immich-cli/immich-go -> immich.nix, once those exist
      users.users.vessel = {
        isNormalUser = true;
        description = "vessel";
        extraGroups = [
          "networkmanager"
          "wheel"
        ];
        packages = [
          pkgs.compose2nix
          pkgs.timewarrior
          pkgs.restic
        ];
      };

      system.stateVersion = "25.11";
    };
}
