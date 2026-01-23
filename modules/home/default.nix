# home-manager configurations that can be globally applied to every machine

{ pkgs, ... }:
{
  imports = [
    ./nvim/default.nix
    ./lf/default.nix
    ./zsh/default.nix
  ];

  programs.git = {
    enable = true;
    userName = "garado";
    userEmail = "alexisgarado@gmail.com";
  };

  home.packages = [ pkgs.git ];
}
