
# █▀▄ ▄▀█ █░█░█ ▄▀█ █▀█ █ █▀▀ █░█
# █▄▀ █▀█ ▀▄▀▄▀ █▀█ █▀▄ █ █▄▄ █▀█

# Nix config for Dawarich, a self-hosted alternative to Google Timeline.

# Dawarich is configured through a docker compose file.
# compose2nix automatically generates a Nix config from this compose file:
# > cd dawarich
# > compose2nix -project=dawarich

{ ... }: {
  imports = [
    ./docker-compose.nix
  ];

  networking.firewall.allowedTCPPorts = [ 2999 ];
}
