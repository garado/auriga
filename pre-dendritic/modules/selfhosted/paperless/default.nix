# █▀█ ▄▀█ █▀█ █▀▀ █▀█ █░░ █▀▀ █▀ █▀
# █▀▀ █▀█ █▀▀ ██▄ █▀▄ █▄▄ ██▄ ▄█ ▄█

# Document storage and retrieval platform

{ ... }:
{
  imports = [ ./docker-compose.nix ];

  # Create required paperless
  systemd.tmpfiles.rules = [
    "d /var/lib/paperless/export  0755 root root -"
    "d /var/lib/paperless/consume 0755 root root -"
  ];
}
