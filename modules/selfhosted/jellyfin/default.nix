
# ░░█ █▀▀ █░░ █░░ █▄█ █▀▀ █ █▄░█
# █▄█ ██▄ █▄▄ █▄▄ ░█░ █▀░ █ █░▀█

# Self-hosted media streaming.

{ ... }: {
  imports = [ ./docker-compose.nix ];
  networking.firewall.allowedTCPPorts = [ 8096 ];

  # Create required jellyfin directories
  systemd.tmpfiles.rules = [
    "d /var/lib/jellyfin/config         0755 root root - -"
    "d /var/lib/jellyfin/cache          0755 root root - -"
    "d /var/lib/jellyfin/media          0755 root root - -"
    "d /var/lib/jellyfin/media/movies   0755 root root - -"
    "d /var/lib/jellyfin/media/tv       0755 root root - -"
  ];
}
