# █▀▄ █ █▀ █▀▀
# █▄▀ █ ▄█ █▄▄

# Utilities for reading/writing CDs and DVDs

{
  flake.modules.homeManager.disc =
    { pkgs, ... }:
    {
      home.packages = [ pkgs.abcde ];

      home.file.".abcde.conf".text = ''
        OUTPUTTYPE=flac
        OUTPUTFORMAT='${"$"}{TRACKNUM} ${"$"}{TRACKNAME}'
        TRACKNUMFORMAT='%02d'
        GETALBUMART=y
        EMBEDALBUMART=n
        CDCOVERARTIST="musicbrainz"
      '';
    };
}
