
# █▀ █ █░░ █░█ █▀▀ █▀█ █▄▄ █░█ █░░ █░░ █▀▀ ▀█▀
# ▄█ █ █▄▄ ▀▄▀ ██▄ █▀▄ █▄█ █▄█ █▄▄ █▄▄ ██▄ ░█░

# Self-hosted personal knowledge vault. Like Obsidian, but less bloated.

{ ... }: {
  imports = [ ./docker-compose.nix ];
  networking.firewall.allowedTCPPorts = [ 3000 ];
}
