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
        claude
        cli-tools
        editor
        forgejo
        git
        home-manager
        homebox
        immich
        mdns
        mosh
        navidrome
        networkmanager
        nfs-server
        nix-settings
        paperless
        rudolfs
        searxng
        silverbullet
        sops
        sshd
        syncthing
        tailscale
        tsdproxy
        unfree
        wiki-sync
        zsh
      ]);

      home-manager.users.vessel = {
        imports = with config.flake.modules.homeManager; [
          claude
          git
          ledger
          lf
          nvim
          tmux
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

        # headless keyring backend
        home.file.".local/share/python_keyring/keyringrc.cfg".text = ''
          [backend]
          default-keyring=keyrings.cryptfile.cryptfile.CryptFileKeyring
        '';
      };

      services.openssh.settings.PrintLastLog = false;

      # nightly: render published Enchiridion notes into site-hugo and
      # open/update a PR. See modules/wiki-sync.nix.
      # NOTE: siteRepo assumed at this path -- clone it there before the
      # timer fires, or update the path if it lives somewhere else on gethsemane.
      services.wiki-sync = {
        enable = true;
        user = "vessel";
        siteRepo = "/home/vessel/Github/garado.github.io/";
        vaultSrc = "/srv/vault/Enchiridion";
      };

      sops.age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ];
      services.tailscale.useRoutingFeatures = "client";

      sops.secrets."restic/pass".owner = "root";
      sops.secrets.b2_env.owner = "root";

      services.nightlyBackup = {
        enable = true;
        jobs = {
          daily-cloud = {
            repository = "b2:gethsemane";
            paths = [
              "/srv/vault/"
              "/var/lib/immich"
            ];
            passwordFile = "/run/secrets/restic/pass";
            environmentFile = "/run/secrets/b2_env";
            onCalendar = "03:00";
          };

          daily-local = {
            repository = "/mnt/blackreach/vault";
            paths = [
              "/srv/vault/"
              "/var/lib/immich"
            ];
            passwordFile = "/run/secrets/restic/pass";
            onCalendar = "02:00";
            mountUnit = "mnt-blackreach.mount";
          };
        };
      };

      services.navidromeServer = {
        enable = true;
        musicFolder = "/srv/vault/Music";
      };

      services.caddyReverseProxy.virtualHosts."enchiridion.garado.dev" = {
        bind = "10.0.0.95";
        reverseProxy = "localhost:3000";
      };

      services.nfsExport = {
        enable = true;
        path = "/srv/vault";
        clients = {
          astarion = "100.90.137.98";
          archaea = "100.68.250.36";
        };
      };

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

      # prevent power-saving wifi throttling
      networking.networkmanager.wifi.powersave = false;

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
          (pkgs.python3.withPackages (ps: [
            ps.keyring
            ps.keyrings-cryptfile
          ]))
        ];
      };

      system.stateVersion = "25.11";
    };
}
