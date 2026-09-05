# █▀█ █▄▄ █▀ █ █▀▄ █ ▄▀█ █▄░█
# █▄█ █▄█ ▄█ █ █▄▀ █ █▀█ █░▀█

{
  flake.modules.nixos.obsidian = {
    unfreePackages = [ "obsidian" ];
  };

  flake.modules.homeManager.obsidian =
    { pkgs, ... }:
    {
      home.packages = [ pkgs.obsidian ];
    };
}
