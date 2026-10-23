# █▀█ ▄▀█ █▀█ █▀▀ █▀█ █░░ █▀▀ █▀ █▀
# █▀▀ █▀█ █▀▀ ██▄ █▀▄ █▄▄ ██▄ ▄█ ▄█

# Document storage and retrieval platform

{
  flake.modules.nixos.paperless =
    { config, ... }:
    {
      imports = [ ./_docker-compose.nix ];

      sops.secrets."paperless/key".owner = "root";

      sops.templates."paperless-env".content = ''
        PAPERLESS_SECRET_KEY=${config.sops.placeholder."paperless/key"}
      '';

      systemd.tmpfiles.rules = [
        "d /var/lib/paperless/export  0755 root root -"
        "d /var/lib/paperless/consume 0755 root root -"
      ];
    };
}
