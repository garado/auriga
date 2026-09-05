# █▀ ▀█▀ █▀▀ ▄▀█ █▀▄▀█
# ▄█ ░█░ ██▄ █▀█ █░▀░█

{
  flake.modules.nixos.steam =
    { pkgs, ... }:
    {
      unfreePackages = [
        "steam"
        "steam-unwrapped"
        "steam-tui"
        "steamcmd"
      ];

      programs.steam.enable = true;

      environment.systemPackages = with pkgs; [
        steam-tui
        steamcmd
      ];
    };
}
