
# ░░█ █▀▀ █░░ █░░ █▄█ █▀▀ █ █▄░█
# █▄█ ██▄ █▄▄ █▄▄ ░█░ █▀░ █ █░▀█

# Self-hosted media streaming.

{ ... }: {
  imports = [ ./docker-compose.nix ];
  networking.firewall.allowedTCPPorts = [ 8096 ];
}
