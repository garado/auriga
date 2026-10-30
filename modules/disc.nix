# █▀▄ █ █▀ █▀▀
# █▄▀ █ ▄█ █▄▄

# Utilities for reading/writing CDs and DVDs

{
  flake.modules.homeManager.disc =
    {
      lib,
      pkgs,
      config,
      ...
    }:
    let
      cfg = config.disc;
    in
    {
      options.disc.abcdeOutputPath = lib.mkOption {
        type = lib.types.str;
        description = "Directory abcde rips into";
        example = "/mnt/vault/Music/.abcde-staging";
      };

      config.home.packages = [
        pkgs.abcde
        pkgs.lame
      ];

      config.home.file.".abcde.conf".text = ''
        OUTPUTTYPE=mp3
        OUTPUTDIR="${cfg.abcdeOutputPath}"
        OUTPUTFORMAT='${"$"}{TRACKNUM} ${"$"}{TRACKFILE}'
        TRACKNUMFORMAT='%02d'
        GETALBUMART=y
        EMBEDALBUMART=n
        CDCOVERARTIST="musicbrainz"
        MP3ENCODERSYNTAX=lame
        LAMEOPTS="-b 320"

        # pass genre through as free text instead of abcde's numeric mapping
        do_getgenreid ()
        {
        	echo "''${@}"
        	return 0
        }
      '';
    };
}
