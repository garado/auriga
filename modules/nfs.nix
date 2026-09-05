# █▄░█ █▀▀ █▀
# █░▀█ █▀░ ▄█

# Remote filesystem.
# Gethsemane serves `/srv/vault` over NFS to specific hosts.

{
  flake.modules.nixos.nfs-server =
    let
      astarionIP = "100.90.137.98";
    in
    {
      services.nfs.server = {
        enable = true;
        exports = ''
          # astarion
          /srv/vault ${astarionIP}(rw,sync,no_subtree_check,root_squash)
        '';
      };

      # restrict access to only the specified IPs
      networking.firewall.extraCommands = ''
        iptables -A nixos-fw -p tcp -s ${astarionIP} --dport 2049 -j nixos-fw-accept
      '';
    };

  flake.modules.nixos.nfs-client = {
    fileSystems."/mnt/vault" = {
      device = "gethsemane:/srv/vault";
      fsType = "nfs";
      options = [
        # only mount on first access
        "x-systemd.automount"
        "noauto"

        "nfsvers=4.2" # pin protocol version, avoids negotiation + legacy sideband ports
        "soft" # fail with an I/O error after timeout instead of hanging forever
        "x-systemd.idle-timeout=600" # unmount after 10min of no activity
        "x-systemd.mount-timeout=10" # give up mounting after 10s of failure
        "timeo=14" # retry timeout
        "_netdev" # start after network is established
      ];
    };
  };
}
