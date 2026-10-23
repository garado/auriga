# █▀▄ █ █▀ █▀▀
# █▄▀ █ ▄█ █▄▄

# Utilities for reading/writing CDs and DVDs

{
  flake.modules.homeManager.disc =
    { pkgs, ... }:
    {
      home.packages = [
        pkgs.abcde
        pkgs.lame
      ];

      home.file.".abcde.conf".text = ''
        OUTPUTTYPE=mp3
        OUTPUTFORMAT='${"$"}{TRACKNUM} ${"$"}{TRACKNAME}'
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
