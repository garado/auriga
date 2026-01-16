# home-manager configurations that can be globally applied to every machine

{ ... }:
{
  imports = [
    ./nvim/default.nix
    ./lf/default.nix
    ./zsh/default.nix
  ];
}
