# █▀ █ ▀█▀ █▀▀ ▄▄ █░█ ▀█▀ █ █░░ █▀
# ▄█ █ ░█░ ██▄ ░░ █▄█ ░█░ █ █▄▄ ▄█

# Regenerate and republish site-utils data
#
# Manual runs:
#   site-utils-deploy                   # run as current user, output in terminal
#   systemctl start site-utils-deploy   # run it exactly like timer does

{
  flake.modules.nixos.site-utils-deploy =
    {
      config,
      pkgs,
      lib,
      ...
    }:
    let
      cfg = config.services.site-utils-deploy;
    in
    {
      options.services.site-utils-deploy = {
        enable = lib.mkEnableOption "twice-daily site-utils data deploy";

        user = lib.mkOption {
          type = lib.types.str;
          description = "User to run the job as (needs git/ssh credentials already set up)";
        };

        repo = lib.mkOption {
          type = lib.types.str;
          default = "/home/${cfg.user}/Github/collection-site-utils/site-utils";
          description = "Path to the site-utils checkout containing deploy.sh";
        };

        onCalendar = lib.mkOption {
          type = lib.types.listOf lib.types.str;
          default = [
            "06:00"
            "18:00"
          ];
          description = "systemd OnCalendar entries; one run per entry";
        };
      };

      config = lib.mkIf cfg.enable {
        # manual trigger
        environment.systemPackages = [
          (pkgs.writeShellScriptBin "site-utils-deploy" ''
            exec ${lib.escapeShellArg cfg.repo}/deploy.sh "$@"
          '')
        ];

        systemd.services.site-utils-deploy = {
          description = "Regenerate site-utils published data and push to the data branch";
          after = [ "network-online.target" ];
          wants = [ "network-online.target" ];
          serviceConfig = {
            Type = "oneshot";
            User = cfg.user;
            WorkingDirectory = cfg.repo;
          };
          environment.HOME = "/home/${cfg.user}";
          script = "${lib.escapeShellArg cfg.repo}/deploy.sh";
          path = [ "/run/current-system/sw" ];
        };

        systemd.timers.site-utils-deploy = {
          wantedBy = [ "timers.target" ];
          timerConfig = {
            OnCalendar = cfg.onCalendar;
            Persistent = true;
          };
        };
      };
    };
}
