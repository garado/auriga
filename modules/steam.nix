# █▀ ▀█▀ █▀▀ ▄▀█ █▀▄▀█
# ▄█ ░█░ ██▄ █▀█ █░▀░█

{
  flake.modules.nixos.steam =
    { pkgs, ... }:
    {
      unfreePackages = [
        "steam"
        "steam-unwrapped"
      ];

      programs.steam.enable = true;
    };
}
