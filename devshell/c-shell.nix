# █▀▀ ░░▄▀ █▀▀ ▄█▄ ▄█▄
# █▄▄ ▄▀░░ █▄▄ ░▀░ ░▀░

# General purpose C/C++ devshell

{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    clang-tools
    gcc
    gcc_multi
    gdb
    glibc
    gnumake
    libgccjit
    valgrind
  ];

  shellHook = ''
    export NIX_DEV_SHELL="C/C++"
    exec zsh
  '';
}
