# █▄▄ ▄▀█ █▀▀ █▄▀ █░█ █▀█
# █▄█ █▀█ █▄▄ █░█ █▄█ █▀▀

# Nightly backups
# - Backblaze B2
# - Local HDD

{
  flake.modules.nixos.backup =
    { config, ... }:
    {
      sops.secrets.restic_pass.owner = "root";
      sops.secrets.b2_env.owner = "root";

      services.restic.backups = {
        # Nightly cloud backup
        daily-cloud = {
          initialize = true;
          repository = "b2:gethsemane";
          passwordFile = config.sops.secrets.restic_pass.path;
          environmentFile = config.sops.secrets.b2_env.path;

          paths = [
            "/srv/vault/"
            "/var/lib/immich"
            "/var/backup/postgresql"
          ];

          timerConfig = {
            OnCalendar = "03:00";
            Persistent = true;
          };

          pruneOpts = [
            "--keep-daily 7"
            "--keep-weekly 4"
            "--keep-monthly 6"
          ];
        };

        # Nightly HDD backup
        daily-blackreach = {
          initialize = true;
          repository = "/mnt/blackreach/vault";
          passwordFile = config.sops.secrets.restic_pass.path;

          paths = [
            "/srv/vault/"
            "/var/lib/immich"
            "/var/backup/postgresql"
          ];

          timerConfig = {
            OnCalendar = "02:00";
            Persistent = true;
          };

          pruneOpts = [
            "--keep-daily 7"
            "--keep-weekly 4"
            "--keep-monthly 6"
          ];
        };
      };

      # ensure immich finishes its own db backup before restic backs up db + media
      systemd.services.restic-backups-daily-cloud.after = [ "postgresqlBackup-immich.service" ];

      # hard-require the actual mount so a disconnected/unmounted blackreach HDD fails the backup
      systemd.services.restic-backups-daily-blackreach = {
        after = [
          "mnt-blackreach.mount"
          "postgresqlBackup-immich.service"
        ];
        requires = [ "mnt-blackreach.mount" ];
      };
    };
}
