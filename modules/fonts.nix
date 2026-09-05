# █▀▀ █▀█ █▄░█ ▀█▀ █▀
# █▀░ █▄█ █░▀█ ░█░ ▄█

{
  flake.modules.nixos.fonts =
    { pkgs, lib, ... }:
    {
      fonts = {
        packages =
          with pkgs;
          [
            # sans-serif
            karla

            # monospace
            mononoki

            # other
            noto-fonts
            noto-fonts-color-emoji
          ]
          ++ builtins.attrValues (
            # pull everything in the ioskeley-mono package set
            lib.filterAttrs (_: v: lib.isDerivation v) ioskeley-mono
          );
      };
    };
}
