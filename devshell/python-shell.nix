# █▀█ █▄█ ▀█▀ █░█ █▀█ █▄░█   █▀▄ █▀▀ █░█ █▀ █░█ █▀▀ █░░ █░░
# █▀▀ ░█░ ░█░ █▀█ █▄█ █░▀█   █▄▀ ██▄ ▀▄▀ ▄█ █▀█ ██▄ █▄▄ █▄▄
#
# General purpose Python devshell

{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = [
      (pkgs.python3.withPackages (ps: with ps; [
        numpy
        requests
        pyyaml
        wn
        pillow
        shapely
      ]))
    ];

  shellHook = ''
    export NIX_DEV_SHELL="Python"
    # if [ -n "$ZSH_VERSION" ]; then return; fi
    # exec zsh
  '';
}
