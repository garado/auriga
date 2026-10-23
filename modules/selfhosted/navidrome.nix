# █▄░█ ▄▀█ █░█ █ █▀▄ █▀█ █▀█ █▀▄▀█ █▀▀
# █░▀█ █▀█ ▀▄▀ █ █▄▀ █▀▄ █▄█ █░▀░█ ██▄

# Music streaming server
#
# Usage:
#   services.navidromeServer = {
#     enable = true;
#     musicFolder = "/srv/vault/Music";
#   };

{
  flake.modules.nixos.navidrome =
    { lib, config, ... }:
    let
      cfg = config.services.navidromeServer;
    in
    {
      options.services.navidromeServer = {
        enable = lib.mkEnableOption "Navidrome music server";

        musicFolder = lib.mkOption {
          type = lib.types.str;
          description = "Path to the music library Navidrome should serve.";
          example = "/srv/vault/Music";
        };
      };

      config = lib.mkIf cfg.enable {
        services.navidrome = {
          enable = true;
          settings = {
            MusicFolder = cfg.musicFolder;
            Address = "0.0.0.0"; # needed for tailscale/tsdproxy access
          };
        };

        networking.firewall.interfaces."podman+" = {
          allowedTCPPorts = [ 4533 ];
        };
      };
    };
}
