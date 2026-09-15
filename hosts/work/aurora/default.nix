# ▄▀█ █░█ █▀█ █▀█ █▀█ ▄▀█
# █▀█ █▄█ █▀▄ █▄█ █▀▄ █▀█

{ config, lib, ... }:
{
  flake.modules.homeManager."hosts/aurora" = {
    imports = with config.flake.modules.homeManager; [
      git
      lf
      nvim
      tmux
      zsh
    ];

    home.stateVersion = "24.11";
    programs.home-manager.enable = true;

    home.username = "agarado";
    home.homeDirectory = "/home/agarado";
  };
}
