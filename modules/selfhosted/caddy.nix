# █▀▀ ▄▀█ █▀▄ █▀▄ █▄█
# █▄▄ █▀█ █▄▀ █▄▀ ░█░

# Reverse proxy for exposing selfhosted services over HTTPS on a real
# domain, with certs issued via Cloudflare DNS-01 (works even though
# the server itself isn't publicly reachable).
#
# Needed to access selfhosted services from devices that aren't on the
# tailnet (e.g. a work laptop), without adding those devices to the
# tailnet.
#
# Uses prebuilt image: ghcr.io/caddybuilds/caddy-cloudflare
#
# Usage, from any host/module:
#   services.caddyReverseProxy.virtualHosts."enchiridion.garado.dev" = {
#     bind = "10.0.0.95";
#     reverseProxy = "localhost:3000";
#   };

{
  flake.modules.nixos.caddy =
    {
      config,
      lib,
      pkgs,
      ...
    }:
    let
      cfg = config.services.caddyReverseProxy;

      caddyfile = pkgs.writeText "Caddyfile" (
        lib.concatStringsSep "\n" (
          lib.mapAttrsToList (domain: vhost: ''
            ${domain} {
              bind ${vhost.bind}
              tls {
                dns cloudflare {env.CLOUDFLARE_API_TOKEN}
                resolvers 1.1.1.1 1.0.0.1
                propagation_timeout 5m
              }
              reverse_proxy ${vhost.reverseProxy}
            }
          '') cfg.virtualHosts
        )
      );
    in
    {
      options.services.caddyReverseProxy = {
        virtualHosts = lib.mkOption {
          type = lib.types.attrsOf (
            lib.types.submodule {
              options = {
                bind = lib.mkOption {
                  type = lib.types.str;
                  description = "Local IP to bind this virtual host to.";
                  example = "10.0.0.95";
                };

                reverseProxy = lib.mkOption {
                  type = lib.types.str;
                  description = "Upstream address to proxy requests to.";
                  example = "localhost:3000";
                };
              };
            }
          );
          default = { };
          description = "Virtual hosts to serve, keyed by domain name.";
        };
      };

      config = lib.mkIf (cfg.virtualHosts != { }) {
        virtualisation.podman.enable = true;
        virtualisation.oci-containers.backend = "podman";

        systemd.tmpfiles.rules = [
          "d /var/lib/caddy/data   0755 root root -"
          "d /var/lib/caddy/config 0755 root root -"
        ];

        sops.secrets."cloudflare/key".owner = "root";

        sops.templates."caddy-env".content = ''
          CLOUDFLARE_API_TOKEN=${config.sops.placeholder."cloudflare/key"}
        '';

        virtualisation.oci-containers.containers.caddy = {
          image = "ghcr.io/caddybuilds/caddy-cloudflare:latest";
          volumes = [
            "${caddyfile}:/etc/caddy/Caddyfile:ro"
            "/var/lib/caddy/data:/data"
            "/var/lib/caddy/config:/config"
          ];
          environmentFiles = [ config.sops.templates."caddy-env".path ];
          extraOptions = [ "--network=host" ]; # proxied services run natively on host
        };

        networking.firewall.allowedTCPPorts = [
          80
          443
        ];
        networking.firewall.allowedUDPPorts = [ 443 ]; # HTTP/3
      };
    };
}
