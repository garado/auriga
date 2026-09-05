# █▀▀ ▄▀█ █▀▄ █▀▄ █▄█
# █▄▄ █▀█ █▄▀ █▄▀ ░█░

# Provides https access to my server over LAN through my existing
# `garado.dev` domain (Cloudflare DNS routes garado.dev -> server IP).
#
# Needed to access my selfhosted Silverbullet instance from my work
# laptop for referencing/editing notes, without adding that laptop to
# my tailnet.

{
  flake.modules.nixos.caddy =
    { config, pkgs, ... }:
    let
      caddyWithCloudflare = pkgs.caddy.withPlugins {
        plugins = [ "github.com/caddy-dns/cloudflare@v0.2.3" ];
        hash = "sha256-cm2FGTXomIPHHiducvno3D0lAHkOgdZwbqGA3ratR+4=";
      };
    in
    {
      sops.secrets.cloudflare_api.owner = "root";

      sops.templates."caddy-env".content = ''
        CLOUDFLARE_API_TOKEN=${config.sops.placeholder.cloudflare_api}
      '';

      services.caddy = {
        enable = true;
        package = caddyWithCloudflare;

        virtualHosts."enchiridion.garado.dev" = {
          extraConfig = ''
            bind 10.0.0.95
            tls {
              dns cloudflare {env.CLOUDFLARE_API_TOKEN}
              resolvers 1.1.1.1 1.0.0.1
              propagation_timeout 5m
            }
            reverse_proxy localhost:3000
          '';
        };
      };

      systemd.services.caddy.serviceConfig.EnvironmentFile = config.sops.templates."caddy-env".path;

      networking.firewall.allowedTCPPorts = [
        80
        443
      ];
    };
}
