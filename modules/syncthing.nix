# █▀ █▄█ █▄░█ █▀▀ ▀█▀ █░█ █ █▄░█ █▀▀
# ▄█ ░█░ █░▀█ █▄▄ ░█░ █▀█ █ █░▀█ █▄█

# A reusable module for Syncthing.
#
# Usage:
#   services.auriga-syncthing = {
#     enable = true;
#     user = "alexis";
#     musicPath = /home/alexis/Music;   # Synced
#     docsPath = null;                  # Not synced
#   };
#
# This requires quite a bit of manual setup still
# TODO Store syncthing cert/key in sops to ensure a consistent device id?

{
  flake.modules.nixos.syncthing =
    {
      config,
      lib,
      pkgs,
      ...
    }:
    with lib;
    let
      cfg = config.services.auriga-syncthing;
    in
    {
      options.services.auriga-syncthing = {
        enable = mkEnableOption "custom syncthing wrapper";
        user = mkOption {
          type = types.str;
          default = "vessel";
        };

        # Set these to null by default
        # If these are null, then their corresponding dirs don't get synced
        musicPath = mkOption {
          type = types.nullOr types.path;
          default = null;
        };
        playlistPath = mkOption {
          type = types.nullOr types.path;
          default = null;
        };
        playlistMetaPath = mkOption {
          type = types.nullOr types.path;
          default = null;
        };
        docsPath = mkOption {
          type = types.nullOr types.path;
          default = null;
        };
        ledgerPath = mkOption {
          type = types.nullOr types.path;
          default = null;
        };
      };

      config = mkIf cfg.enable {
        services.syncthing = {
          enable = true;
          user = cfg.user;
          dataDir = "/home/${cfg.user}/.config/syncthing";
          configDir = "/home/${cfg.user}/.config/syncthing";
          systemService = true;
          overrideDevices = true;
          overrideFolders = true;

          settings = {
            devices = {
              "astarion" = {
                id = "PSNQSUZ-NIRMICH-VJJABTE-WEBWRTF-KPUIX4Y-XP2F7LK-OTGEUHD-RT5KFAT";
              };
              "gethsemane" = {
                id = "77K3CD7-4BU5KJ5-HVNMEO6-PQK7UE5-I337CMW-TPQHXSY-ZN6S57W-OOV2PAL";
              };
            };

            # Folders to sync
            folders =
              (optionalAttrs (cfg.musicPath != null) {
                "Music" = {
                  path = toString cfg.musicPath;
                  devices = builtins.attrNames config.services.syncthing.settings.devices;
                };
              })
              // (optionalAttrs (cfg.docsPath != null) {
                "Documents" = {
                  path = toString cfg.docsPath;
                  devices = builtins.attrNames config.services.syncthing.settings.devices;
                };
              })
              // (optionalAttrs (cfg.ledgerPath != null) {
                "Ledger" = {
                  path = toString cfg.ledgerPath;
                  devices = builtins.attrNames config.services.syncthing.settings.devices;
                };
              })
              // (optionalAttrs (cfg.playlistPath != null) {
                "Playlists" = {
                  path = toString cfg.playlistPath;
                  devices = builtins.attrNames config.services.syncthing.settings.devices;
                };
              })
              // (optionalAttrs (cfg.playlistMetaPath != null) {
                "PlaylistMetadata" = {
                  path = toString cfg.playlistMetaPath;
                  devices = builtins.attrNames config.services.syncthing.settings.devices;
                };
              });
          };
        };

        # Ports needed for discovery/sync
        networking.firewall.allowedTCPPorts = [
          22000
          8384
        ];
        networking.firewall.allowedUDPPorts = [
          22000
          21027
        ];

        # Ensure config dir exists before starting services
        systemd.tmpfiles.rules = [
          "d /home/${cfg.user}/.config/syncthing 0700 ${cfg.user} users - -"
        ];

        # Ensure a syncthing config exists before merging configs
        systemd.services.syncthing.preStart = ''
          if [ ! -f /home/${cfg.user}/.config/syncthing/config.xml ]; then
            ${pkgs.syncthing}/bin/syncthing generate --home=/home/${cfg.user}/.config/syncthing
          fi
        '';
      };
    };
}
