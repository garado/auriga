# █░█░█ █ █▄▀ █   █▀ █▄█ █▄░█ █▀▀
# ▀▄▀▄▀ █ █░█ █   ▄█ ░█░ █░▀█ █▄▄

# Nightly job: render published Silverbullet notes into site-hugo's
# content/wiki/ and open/update a PR. Runs `python scripts/preprocess.py wiki
# publish` from site-hugo's own flake devshell (pyyaml/node/gh/hugo already
# live there, no need to duplicate them here).
#
# Meant to run on the machine hosting the vault itself (gethsemane) — see
# scripts/_wiki.py in site-hugo for why: `wiki publish` doesn't rsync from the
# vault first, it expects --src to already point at the vault content.
#
# The excalidraw-to-svg gist (garado/3cc6ae17ba8b022660311ed1efe623da) isn't
# Nix-packaged; it's cloned + `npm install`ed on first run and left in place,
# same "built on demand" approach as labyrinthine.nix.

{
  flake.modules.nixos.wiki-sync =
    {
      config,
      pkgs,
      lib,
      ...
    }:
    let
      cfg = config.services.wiki-sync;
    in
    {
      options.services.wiki-sync = {
        enable = lib.mkEnableOption "nightly wiki sync + publish-PR job";

        user = lib.mkOption {
          type = lib.types.str;
          description = "User to run the job as (needs git/gh credentials already set up)";
        };

        siteRepo = lib.mkOption {
          type = lib.types.str;
          description = "Path to the site-hugo checkout";
        };

        vaultSrc = lib.mkOption {
          type = lib.types.str;
          description = "Path to the vault's published notes (passed as --src)";
        };

        excalidrawGistDir = lib.mkOption {
          type = lib.types.str;
          default = "/home/${cfg.user}/Github/gist-wiki-sync";
          description = "Where to clone the excalidraw-to-svg gist";
        };

        onCalendar = lib.mkOption {
          type = lib.types.str;
          default = "04:00";
          description = "systemd OnCalendar for the nightly publish run";
        };
      };

      config = lib.mkIf cfg.enable {
        environment.systemPackages = [
          (pkgs.writeShellScriptBin "wiki-sync" ''
            cd ${lib.escapeShellArg cfg.siteRepo}
            export WIKI_SYNC_EXCALIDRAW_SCRIPT="${lib.escapeShellArg cfg.excalidrawGistDir}/excalidraw-to-svg.mjs"
            exec nix develop "path:${lib.escapeShellArg cfg.siteRepo}" -c python scripts/preprocess.py wiki sync "$@"
          '')
          (pkgs.writeShellScriptBin "wiki-publish" ''
            set -e
            cd ${lib.escapeShellArg cfg.siteRepo}
            export WIKI_SYNC_EXCALIDRAW_SCRIPT="${lib.escapeShellArg cfg.excalidrawGistDir}/excalidraw-to-svg.mjs"
            if [ ! -d "${lib.escapeShellArg cfg.excalidrawGistDir}" ]; then
              ${pkgs.git}/bin/git clone git@gist.github.com:3cc6ae17ba8b022660311ed1efe623da.git \
                ${lib.escapeShellArg cfg.excalidrawGistDir}
            fi
            if [ ! -d "${lib.escapeShellArg cfg.excalidrawGistDir}/node_modules" ]; then
              (cd ${lib.escapeShellArg cfg.excalidrawGistDir} && ${pkgs.nodejs}/bin/npm install)
            fi
            exec nix develop "path:${lib.escapeShellArg cfg.siteRepo}" -c python scripts/preprocess.py wiki publish --src ${lib.escapeShellArg cfg.vaultSrc} "$@"
          '')
        ];

        systemd.services.wiki-publish = {
          description = "Sync vault notes into site-hugo and open/update a PR";
          serviceConfig = {
            Type = "oneshot";
            User = cfg.user;
          };
          script = "wiki-publish";
          path = [ "/run/current-system/sw/bin" ];
        };

        systemd.timers.wiki-publish = {
          wantedBy = [ "timers.target" ];
          timerConfig = {
            OnCalendar = cfg.onCalendar;
            Persistent = true;
          };
        };
      };
    };
}
