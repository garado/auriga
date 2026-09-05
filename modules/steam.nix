# █▀ ▀█▀ █▀▀ ▄▀█ █▀▄▀█
# ▄█ ░█░ ██▄ █▀█ █░▀░█

{
  flake.modules.nixos.steam = {
    unfreePackages = [
      "steam"
      "steam-unwrapped"
    ];

    programs.steam.enable = true;
  };
}
