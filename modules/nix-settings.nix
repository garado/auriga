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

      # allow remote builds
      trusted-users = [ "root" "vessel" ];
    };
  };
}
