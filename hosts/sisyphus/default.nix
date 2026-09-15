# █▀ █ █▀ █▄█ █▀█ █░█ █░█ █▀
# ▄█ █ ▄█ ░█░ █▀▀ █▀█ █▄█ ▄█

# For non-NixOS machines with Nix installed (usually work laptops).
# These machines can only have home-manager configs.

{ config, lib, ... }:
{
  flake.modules.homeManager."hosts/sisyphus" = {
    imports =
      with config.flake.modules.homeManager;
      [
        git
        lf
        nvim
        tmux
        zsh
      ]

      # Work-specific settings live in gitignored files
      ++ lib.optional (builtins.pathExists ./aurora.nix) ./aurora.nix;

    home.stateVersion = "24.11";

    # let home-manager manage/upgrade itself
    programs.home-manager.enable = true;
  };
}
