# █▀█ ▄▀█ █▀█ █▀▀ █▀█ █░░ █▀▀ █▀ █▀
# █▀▀ █▀█ █▀▀ ██▄ █▀▄ █▄▄ ██▄ ▄█ ▄█

# Document storage and retrieval platform

{
  flake.modules.nixos.paperless = {
    imports = [ ./_docker-compose.nix ];

    systemd.tmpfiles.rules = [
      "d /var/lib/paperless/export  0755 root root -"
      "d /var/lib/paperless/consume 0755 root root -"
    ];
  };
}
