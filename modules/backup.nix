# █▄▄ ▄▀█ █▀▀ █▄▀ █░█ █▀█
# █▄█ █▀█ █▄▄ █░█ █▄█ █▀▀

# 3-2-1 backup: cloud (Backblaze B2) + local device (blackreach HDD).

{
  flake.modules.nixos.backup =
    { config, ... }:
    {
      sops.secrets.restic_pass.owner = "root";
      sops.secrets.b2_env.owner = "root";

      services.restic.backups = {
        daily-cloud = {
          initialize = true;
          repository = "b2:gethsemane";
          passwordFile = config.sops.secrets.restic_pass.path;
          environmentFile = config.sops.secrets.b2_env.path;

          paths = [ "/srv/vault/" ];

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

        daily-blackreach = {
          initialize = true;
          repository = "/mnt/blackreach/Vault";
          passwordFile = config.sops.secrets.restic_pass.path;

          paths = [ "/srv/vault/" ];

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
    };
}
