{ ... }:
{
  imports = [ ./docker-compose.nix ];

  networking.firewall.allowedTCPPorts = [ 6881 ];
  networking.firewall.allowedUDPPorts = [ 6881 ];

  systemd.tmpfiles.rules = [
    "d /var/lib/qbittorrent/config  0755 root root -"
    "d /var/lib/prowlarr/config     0755 root root -"
    "d /var/lib/sonarr/config       0755 root root -"
    "d /var/lib/radarr/config       0755 root root -"
    "d /var/lib/jellyseerr/config   0755 root root -"
  ];
}
