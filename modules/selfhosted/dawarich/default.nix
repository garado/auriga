
# █▀▄ ▄▀█ █░█░█ ▄▀█ █▀█ █ █▀▀ █░█
# █▄▀ █▀█ ▀▄▀▄▀ █▀█ █▀▄ █ █▄▄ █▀█

# Self-hosted alternative to Google Timeline.
# Dawarich is configured through a docker compose file.
# compose2nix automatically generates a Nix config from this compose file.


{ ... }: {
  imports = [
    ./docker-compose.nix
  ];
}
