# █▀▀ ▄▀█ █▀▄ █▀▄ █▄█
# █▄▄ █▀█ █▄▀ █▄▀ ░█░

# Provides https access to my server over LAN through my existing
# `garado.dev` domain (Cloudflare DNS routes garado.dev -> server IP).
#
# Needed to access my selfhosted Silverbullet instance from my work
# laptop for referencing/editing notes, without adding that laptop to
# my tailnet.
#
# Uses prebuilt image: ghcr.io/caddybuilds/caddy-cloudflare

{
  flake.modules.nixos.caddy =
    { config, pkgs, ... }:
    let
      caddyfile = pkgs.writeText "Caddyfile" ''
        enchiridion.garado.dev {
          bind 10.0.0.95
          tls {
            dns cloudflare {env.CLOUDFLARE_API_TOKEN}
            resolvers 1.1.1.1 1.0.0.1
            propagation_timeout 5m
          }
          reverse_proxy localhost:3000
        }
      '';
    in
    {
      virtualisation.podman.enable = true;
      virtualisation.oci-containers.backend = "podman";

      sops.secrets.cloudflare_api.owner = "root";

      sops.templates."caddy-env".content = ''
        CLOUDFLARE_API_TOKEN=${config.sops.placeholder.cloudflare_api}
      '';

      virtualisation.oci-containers.containers.caddy = {
        image = "ghcr.io/caddybuilds/caddy-cloudflare:latest";
        volumes = [
          "${caddyfile}:/etc/caddy/Caddyfile:ro"
          "/var/lib/caddy/data:/data"
          "/var/lib/caddy/config:/config"
        ];
        environmentFiles = [ config.sops.templates."caddy-env".path ];
        extraOptions = [ "--network=host" ]; # silverbullet runs natively on host
      };

      networking.firewall.allowedTCPPorts = [
        80
        443
      ];
      networking.firewall.allowedUDPPorts = [ 443 ]; # HTTP/3
    };
}
