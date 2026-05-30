
# █░█ █▀█ █▀▄▀█ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█   █▀▀ █░░ █▀█ █▄▄ ▄▀█ █░░   █▀▀ █▀▀ █▀▀
# █▀█ █▄█ █░▀░█ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄   █▄█ █▄▄ █▄█ █▄█ █▀█ █▄▄   █▄▄ █▀░ █▄█

# HomeManager configurations that can be applied to every machine.

{ pkgs, ... }:
{
  imports = [
    ./nvim/default.nix
    ./lf/default.nix
    ./zsh/default.nix
    ./gtk/default.nix
    ./kitty/default.nix
    ./taskwarrior/default.nix
    ./hyprland/default.nix
  ];

  programs.git = {
    enable = true;
    settings = {
      user.name = "garado";
      user.email = "alexisgarado@gmail.com";
    };
  };

  home.packages = [ pkgs.git ];
}
