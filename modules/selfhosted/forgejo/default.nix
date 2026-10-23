# █▀▀ █▀█ █▀█ █▀▀ █▀▀ ░░█ █▀█
# █▀░ █▄█ █▀▄ █▄█ ██▄ █▄█ █▄█

# Self-hosted git server (Forgejo)

{
  flake.modules.nixos.forgejo =
    { ... }:
    {
      imports = [ ./_docker-compose.nix ];

      systemd.tmpfiles.rules = [
        "d /var/lib/forgejo/data 0755 root root -"
      ];

      networking.firewall.interfaces."tailscale0".allowedTCPPorts = [ 2222 ];
    };
}
