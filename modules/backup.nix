# █▄▄ ▄▀█ █▀▀ █▄▀ █░█ █▀█
# █▄█ █▀█ █▄▄ █░█ █▄█ █▀▀

# Nightly restic backup jobs.

# Example usage:
#
# services.nightlyBackup = {
#   enable = true;
#   jobs = {
#     daily-cloud = {
#       repository = "b2:gethsemane";
#       paths = [ "/srv/vault/" "/var/lib/immich" ];
#       passwordFile = config.sops.secrets.restic_pass.path;
#       environmentFile = config.sops.secrets.b2_env.path;
#       onCalendar = "03:00";
#     };
#
#     daily-local = {
#       repository = "/mnt/blackreach/vault";
#       paths = [ "/srv/vault/" "/var/lib/immich" ];
#       passwordFile = config.sops.secrets.restic_pass.path;
#       onCalendar = "02:00";
#
#       # hard-require the mount so a disconnected disk fails the backup
#       mountUnit = "mnt-blackreach.mount";
#     };
#   };
# };

{
  flake.modules.nixos.backup =
    { lib, config, ... }:
    let
      cfg = config.services.nightlyBackup;

      jobModule = lib.types.submodule {
        options = {
          repository = lib.mkOption {
            type = lib.types.str;
            description = "restic repository string.";
            example = "b2:gethsemane";
          };

          paths = lib.mkOption {
            type = lib.types.listOf lib.types.str;
            description = "Paths to back up.";
          };

          passwordFile = lib.mkOption {
            type = lib.types.str;
            description = "Path to the file containing the restic repository password.";
          };

          environmentFile = lib.mkOption {
            type = lib.types.nullOr lib.types.str;
            default = null;
            description = ''
              Path to an EnvironmentFile with credentials for the
              repository backend (e.g. B2 keys). Null if the backend
              needs none.
            '';
          };

          onCalendar = lib.mkOption {
            type = lib.types.str;
            default = "03:00";
            description = "systemd OnCalendar for this job.";
          };

          pruneOpts = lib.mkOption {
            type = lib.types.listOf lib.types.str;
            default = [
              "--keep-daily 7"
              "--keep-weekly 4"
              "--keep-monthly 6"
            ];
            description = "restic prune options for this job.";
          };

          mountUnit = lib.mkOption {
            type = lib.types.nullOr lib.types.str;
            default = null;
            description = "systemd mount unit this job should hard-require before running.";
            example = "mnt-blackreach.mount";
          };
        };
      };
    in
    {
      options.services.nightlyBackup = {
        enable = lib.mkEnableOption "nightly restic backup jobs";

        jobs = lib.mkOption {
          type = lib.types.attrsOf jobModule;
          default = { };
          description = "Named restic backup jobs.";
        };
      };

      config = lib.mkIf cfg.enable {
        services.restic.backups = lib.mapAttrs (_name: job: {
          initialize = true;
          repository = job.repository;
          passwordFile = job.passwordFile;
          environmentFile = job.environmentFile;
          paths = job.paths;
          timerConfig = {
            OnCalendar = job.onCalendar;
            Persistent = true;
          };
          pruneOpts = job.pruneOpts;
        }) cfg.jobs;

        systemd.services = lib.mapAttrs' (
          name: job:
          lib.nameValuePair "restic-backups-${name}" {
            after = [ job.mountUnit ];
            requires = [ job.mountUnit ];
          }
        ) (lib.filterAttrs (_name: job: job.mountUnit != null) cfg.jobs);
      };
    };
}
