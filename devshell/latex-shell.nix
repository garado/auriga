# █░░ ▄▀█ ▀█▀ █▀▀ ▀▄▀
# █▄▄ █▀█ ░█░ ██▄ █░█

# General purpose Latex devshell

{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    texlive.combined.scheme-medium
  ];

  shellHook = ''
    export NIX_DEV_SHELL="LaTeX"
    exec zsh
  '';
}
