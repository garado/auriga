# █▄░█ ▄▀█ █░█ █ █▀▄ █▀█ █▀█ █▀▄▀█ █▀▀
# █░▀█ █▀█ ▀▄▀ █ █▄▀ █▀▄ █▄█ █░▀░█ ██▄

# Music streaming server

{
  flake.modules.nixos.navidrome = {
    services.navidrome = {
      enable = true;
      settings = {
        MusicFolder = "/srv/vault/Music";
        Address = "0.0.0.0"; # needed for tailscale/tsdproxy access
      };
    };

    networking.firewall.interfaces."podman+" = {
      allowedTCPPorts = [ 4533 ];
    };
  };
}
