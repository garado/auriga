# █▄░█ █▀▀ █▀
# █░▀█ █▀░ ▄█

# Remote filesystem: export a directory from a server to specific clients.
#
# Usage, server side:
#   services.nfsExport = {
#     enable = true;
#     path = "/srv/vault";
#     clients = {
#       astarion = "100.90.137.98";
#       archaea = "100.68.250.36";
#     };
#   };
#
# Usage, client side:
#   services.nfsMount = {
#     enable = true;
#     server = "gethsemane";
#     remotePath = "/srv/vault";
#     mountPoint = "/mnt/vault"; # optional, this is the default
#   };

{
  flake.modules.nixos.nfs-server =
    { lib, config, ... }:
    let
      cfg = config.services.nfsExport;
    in
    {
      options.services.nfsExport = {
        enable = lib.mkEnableOption "NFS export of a directory to specific clients";

        path = lib.mkOption {
          type = lib.types.str;
          description = "Absolute path to export over NFS.";
          example = "/srv/vault";
        };

        clients = lib.mkOption {
          type = lib.types.attrsOf lib.types.str;
          default = { };
          description = ''
            Clients allowed to mount the export, as `{ name = ip; }`.
            Each one gets its own export line and a firewall allow-rule
            scoped to its IP on port 2049.
          '';
          example = {
            astarion = "100.90.137.98";
            archaea = "100.68.250.36";
          };
        };

        exportOptions = lib.mkOption {
          type = lib.types.str;
          default = "rw,sync,no_subtree_check,root_squash";
          description = "NFS export options applied for every client.";
        };
      };

      config = lib.mkIf cfg.enable {
        services.nfs.server = {
          enable = true;
          exports = lib.concatStringsSep "\n" (
            lib.mapAttrsToList (name: ip: ''
              # ${name}
              ${cfg.path} ${ip}(${cfg.exportOptions})
            '') cfg.clients
          );
        };

        # restrict access to only the specified clients
        networking.firewall.extraCommands = lib.concatStringsSep "\n" (
          lib.mapAttrsToList (
            _name: ip: "iptables -A nixos-fw -p tcp -s ${ip} --dport 2049 -j nixos-fw-accept"
          ) cfg.clients
        );
      };
    };

  flake.modules.nixos.nfs-client =
    { lib, config, ... }:
    let
      cfg = config.services.nfsMount;
    in
    {
      options.services.nfsMount = {
        enable = lib.mkEnableOption "Mount a remote NFS export";

        server = lib.mkOption {
          type = lib.types.str;
          description = "Hostname or IP of the NFS server.";
          example = "gethsemane";
        };

        remotePath = lib.mkOption {
          type = lib.types.str;
          description = "Path exported by the server.";
          example = "/srv/vault";
        };

        mountPoint = lib.mkOption {
          type = lib.types.str;
          default = "/mnt/vault";
          description = "Local path to mount the export at.";
        };
      };

      config = lib.mkIf cfg.enable {
        fileSystems.${cfg.mountPoint} = {
          device = "${cfg.server}:${cfg.remotePath}";
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
    };
}
