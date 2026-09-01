# █▀▀ ░░▄▀ █▀▀ ▄█▄ ▄█▄   █▀▄ █▀▀ █░█ █▀ █░█ █▀▀ █░░ █░░
# █▄▄ ▄▀░░ █▄▄ ░▀░ ░▀░   █▄▀ ██▄ ▀▄▀ ▄█ █▀█ ██▄ █▄▄ █▄▄
#
# General purpose C/C++ devshell for quick work

{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    gcc
    gdb
    glibc
    gnumake
    valgrind
  ];

  shellHook = ''
    export NIX_DEV_SHELL="C/C++"
    exec zsh
  '';
}
