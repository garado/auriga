# █▀█ █▄▄ █▀ █ █▀▄ █ ▄▀█ █▄░█
# █▄█ █▄█ ▄█ █ █▄▀ █ █▀█ █░▀█

# NOTE: installed via environment.systemPackages rather than home.packages
# because home-manager.useGlobalPkgs isn't enabled yet, so home-manager's
# own pkgs instance wouldn't pick up the unfree exception below.

{
  flake.modules.nixos.obsidian =
    { pkgs, ... }:
    {
      unfreePackages = [ "obsidian" ];

      environment.systemPackages = [ pkgs.obsidian ];
    };
}
