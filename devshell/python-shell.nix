# █▀█ █▄█ ▀█▀ █░█ █▀█ █▄░█   █▀▄ █▀▀ █░█ █▀ █░█ █▀▀ █░░ █░░
# █▀▀ ░█░ ░█░ █▀█ █▄█ █░▀█   █▄▀ ██▄ ▀▄▀ ▄█ █▀█ ██▄ █▄▄ █▄▄
#
# General purpose Python devshell

{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    python3
    python3Packages.numpy
    python3Packages.requests
  ];

  shellHook = ''
    export NIX_DEV_SHELL="Python"
    exec zsh
  '';
}
