# █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀   █▀▀ █▀▀ █▄░█ █▀▀ █▀█ ▄▀█ ▀█▀ █▀█ █▀█
# █▄▄ █▄█ █░▀█ █▀░ █ █▄█   █▄█ ██▄ █░▀█ ██▄ █▀▄ █▀█ ░█░ █▄█ █▀▄

# This file programmatically generates host and home-manager configurations.
# All of my host/home-manager configs are defined in `//hosts`.
#
# nixos:
# - Finds all `flake.modules.nixos."hosts/*"`
#     - example:    flake.modules.nixos."hosts/astarion" = { ... }
# - Turns it into `nixosConfigurations.<name>` that nixos-rebuild can use
#     - example:    nixos-rebuild switch --flake .#astarion
#
# home-manager:
# - Finds all `flake.modules.homeManager."hosts/*"`
#     - example:    flake.modules.homeManager."hosts/pkgs-only" = { ... }
# - Turns it into `homeConfigurations.<name>` that `home-manager switch` can use

{
  config,
  inputs,
  lib,
  ...
}:
let
  hostConfigs =
    modulesByPath: build:
    lib.mapAttrs' (
      path: module: lib.nameValuePair (lib.removePrefix "hosts/" path) (build module path)
    ) (lib.filterAttrs (n: _: lib.hasPrefix "hosts/" n) modulesByPath);
in
{
  flake.nixosConfigurations = hostConfigs config.flake.modules.nixos (
    module: path:
    inputs.nixpkgs.lib.nixosSystem {
      specialArgs = { inherit inputs; };
      modules = [
        module
        { networking.hostName = lib.mkDefault (lib.removePrefix "hosts/" path); }
      ];
    }
  );

  flake.homeConfigurations = hostConfigs config.flake.modules.homeManager (
    module: _:
    inputs.home-manager.lib.homeManagerConfiguration {
      pkgs = import inputs.nixpkgs { system = "x86_64-linux"; };
      extraSpecialArgs = {
        inherit inputs;
        self = inputs.self;
      };
      modules = [ module ];
    }
  );
}
