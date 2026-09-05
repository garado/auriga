# █▄░█ █ ▀▄▀   █▀ █▀▀ ▀█▀ ▀█▀ █ █▄░█ █▀▀ █▀
# █░▀█ █ █░█   ▄█ ██▄ ░█░ ░█░ █ █░▀█ █▄█ ▄█

{
  flake.modules.nixos.nix-settings = {
    nix.settings = {
      experimental-features = [
        "nix-command"
        "flakes"
      ];
      auto-optimise-store = true;
    };

    nix.gc = {
      automatic = true;
      dates = "weekly";
      options = "--delete-older-than 30d";
    };

    nix.optimise.automatic = true;

    boot.loader.systemd-boot.configurationLimit = 20;
  };
}
