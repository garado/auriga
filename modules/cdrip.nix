# ▄▀█ █▄▄ █▀▀ █▀▄ █▀▀
# █▀█ █▄█ █▄▄ █▄▀ ██▄

{
  flake.modules.homeManager.cdrip =
    {
      lib,
      pkgs,
      config,
      ...
    }:
    let
      cfg = config.cdrip;
    in
    {
      options.cdrip.stagingPath = lib.mkOption {
        type = lib.types.str;
        description = "Directory that abcde rips into";
        example = "/mnt/vault/Music/Library/.abcde-staging";
      };

      options.cdrip.libraryPath = lib.mkOption {
        type = lib.types.str;
        description = ''
          Where tracks from finished rips are placed, as `<libraryPath>/<Artist>/<Album> (<Year>)/<tracks>`.
        '';
        example = "/mnt/vault/Music/Library";
      };

      config.home.packages = [
        pkgs.abcde
        pkgs.lame

        (pkgs.writeShellScriptBin "cdrip" ''
          set -euo pipefail

          staging="${cfg.stagingPath}"
          library="${cfg.libraryPath}"

          abcde "$@"

          if [ -n "$(${pkgs.coreutils}/bin/ls -A "$staging" 2>/dev/null)" ]; then
            while IFS= read -r -d "" albumdir; do
              mapfile -d "" tracks < <(${pkgs.findutils}/bin/find "$albumdir" -maxdepth 1 -type f -name '*.mp3' -print0 | ${pkgs.coreutils}/bin/sort -z)

              if [ "${"$"}{#tracks[@]}" -eq 0 ]; then
                continue
              fi

              rel="${"$"}{albumdir#"$staging"/}"
              rel="${"$"}{rel//YEAROPEN/(}"
              rel="${"$"}{rel//YEARCLOSE/)}"
              dest="$library/$rel"

              ${pkgs.coreutils}/bin/mkdir -p "$dest"
              ${pkgs.rsync}/bin/rsync -a --remove-source-files "$albumdir"/ "$dest"/

              echo "Placed ${"$"}{#tracks[@]} tracks into $dest"
              for track in "${"$"}{tracks[@]}"; do
                echo "$(${pkgs.coreutils}/bin/basename "$track")"
              done
            done < <(${pkgs.findutils}/bin/find "$staging" -mindepth 2 -maxdepth 2 -type d -print0)

            ${pkgs.coreutils}/bin/rm -rf -- "$staging"/*
          fi
        '')
      ];

      config.home.file.".abcde.conf".text = ''
        OUTPUTTYPE=mp3
        OUTPUTDIR="${cfg.stagingPath}"
        WAVOUTPUTDIR="${"$"}{OUTPUTDIR}"
        OUTPUTFORMAT='${"$"}{ARTISTFILE}/${"$"}{ALBUMFILE} YEAROPEN${"$"}{YEAR}YEARCLOSE/${"$"}{TRACKNUM} ${"$"}{TRACKFILE}'
        PADTRACKS=y
        GETALBUMART=y
        EMBEDALBUMART=y
        CDCOVERARTIST="musicbrainz"
        MP3ENCODERSYNTAX=lame
        LAMEOPTS="-b 320"

        # pass genre through as free text instead of abcde's numeric mapping
        do_getgenreid ()
        {
        	echo "''${@}"
        	return 0
        }

        # strip only filesystem-unsafe characters, keep spaces
        mungefilename ()
        {
        	echo "''${@}" | sed -e 's/^\.*//' | tr -d '/\\:*?"<>|'
        }
      '';
    };
}
