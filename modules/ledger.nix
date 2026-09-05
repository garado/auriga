# █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█
# █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄

{
  flake.modules.homeManager.ledger =
    { pkgs, ... }:
    {
      home.packages = with pkgs; [
        hledger
        reckon
      ];

      programs.ledger = {
        enable = true;
        settings = {
          file = "~/Enchiridion/self/ledger/2024/2024.ledger"; # TODO per-host config
        };
      };
    };
}
