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
        pkgs.id3v2
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
        ID3TAGV=id3v2.3
      '';
    };
}
