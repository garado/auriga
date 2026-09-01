# █ █▀▄▀█ █▀▄▀█ █ █▀▀ █░█
# █ █░▀░█ █░▀░█ █ █▄▄ █▀█

# Google Photos alternative

{ ... }:
{
  services.immich = {
    enable = true;
    mediaLocation = "/var/lib/immich";
    host = "0.0.0.0"; # needed for tailscale access
  };
}
