# █▀█ █▄█ ▀█▀ █░█ █▀█ █▄░█   █▀▄ █▀▀ █░█ █▀ █░█ █▀▀ █░░ █░░
# █▀▀ ░█░ ░█░ █▀█ █▄█ █░▀█   █▄▀ ██▄ ▀▄▀ ▄█ █▀█ ██▄ █▄▄ █▄▄

# General purpose Python devshell

{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  buildInputs = [
    pkgs.typst
    pkgs.poppler_utils
    pkgs.noto-fonts-color-emoji
    (pkgs.python3.withPackages (
      ps: with ps; [
        numpy
        requests
        pyyaml
        wn
        pillow
        shapely
        piexif
        pypdf
      ]
    ))
  ];

  shellHook = ''
    export NIX_DEV_SHELL="Python"
    export TYPST_FONT_PATHS="$HOME/.local/share/fonts:${pkgs.typst}/share/typst/fonts:${pkgs.noto-fonts-color-emoji}/share/fonts/noto"
  '';
}
