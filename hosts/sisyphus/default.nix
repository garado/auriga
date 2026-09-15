# █▀ █ █▀ █▄█ █▀█ █░█ █░█ █▀
# ▄█ █ ▄█ ░█░ █▀▀ █▀█ █▄█ ▄█

# For non-NixOS machines with Nix installed (usually work laptops).
# These machines can only have home-manager configs.

{ config, ... }:
{
  flake.modules.homeManager."hosts/sisyphus" = {
    imports = with config.flake.modules.homeManager; [
      git
      lf
      nvim
      tmux
      zsh
    ];

    home.stateVersion = "24.11";

    # let home-manager manage/upgrade itself
    programs.home-manager.enable = true;
  };
}
