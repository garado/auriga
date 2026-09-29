# █▀█ █░█ █▀▄ █▀█ █░░ █▀▀ █▀
# █▀▄ █▄█ █▄▀ █▄█ █▄▄ █▀░ ▄█

# Self-hosted Git LFS server

{
  flake.modules.nixos.rudolfs =
    { ... }:
    {
      imports = [ ./_docker-compose.nix ];

      systemd.tmpfiles.rules = [
        "d /var/lib/rudolfs/cache 0755 root root -"
        "d /var/lib/rudolfs/storage 0755 root root -"
      ];
    };
}
