# █▀▄▀█ █▀▄ █▄░█ █▀
# █░▀░█ █▄▀ █░▀█ ▄█

# Local network hostname resolution + service discovery.

{
  flake.modules.nixos.mdns = {
    services.resolved.enable = true;
    networking.networkmanager.dns = "systemd-resolved";
    networking.firewall.allowedUDPPorts = [ 5353 ];

    services.avahi = {
      enable = true;
      nssmdns4 = true;
      publish = {
        enable = true;
        addresses = true;
        workstation = true;
      };
    };
  };
}
