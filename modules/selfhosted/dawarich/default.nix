# █▀▄ ▄▀█ █░█░█ ▄▀█ █▀█ █ █▀▀ █░█
# █▄▀ █▀█ ▀▄▀▄▀ █▀█ █▀▄ █ █▄▄ █▀█

# Self-hosted alternative to Google Timeline.

{
  flake.modules.nixos.dawarich = {
    imports = [ ./_docker-compose.nix ];
    networking.firewall.allowedTCPPorts = [ 2999 ];
  };
}
