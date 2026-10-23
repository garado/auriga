# █▀ █▀▀ ▄▀█ █▀█ ▀▄▀ █▄░█ █▀▀
# ▄█ ██▄ █▀█ █▀▄ █░█ █░▀█ █▄█

# self-hosted web search

{
  flake.modules.nixos.searxng =
    { config, ... }:
    {
      sops.secrets."searx/key".owner = "searx";

      sops.templates."searx-env".content = ''
        SEARX_SECRET=${config.sops.placeholder."searx/key"}
      '';

      services.searx = {
        enable = true;
        environmentFile = config.sops.templates."searx-env".path;
        settings = {
          server = {
            port = 8081;
            bind_address = "0.0.0.0"; # needed for tailscale/tsdproxy access
            secret_key = "$SEARX_SECRET";
          };
          search.formats = [
            "html"
            "json"
          ];
        };
      };

      networking.firewall.interfaces."podman+" = {
        allowedTCPPorts = [ 8081 ];
      };
    };
}
