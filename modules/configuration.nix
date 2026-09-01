
# █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀ █░█ █▀█ ▄▀█ ▀█▀ █ █▀█ █▄░█
# █▄▄ █▄█ █░▀█ █▀░ █ █▄█ █▄█ █▀▄ █▀█ ░█░ █ █▄█ █░▀█

{ config, inputs, lib, ... }:
{
  flake.nixosConfigurations = lib.mapAttrs'
    (path: module: lib.nameValuePair
     (lib.removePrefix "hosts/" path)
     (inputs.nixpkgs.lib.nixosSystem {
      specialArgs = { inherit inputs; };
      modules = [ module ];
      }))
  (lib.filterAttrs (n: _: lib.hasPrefix "hosts/" n) config.flake.modules.nixos);
}
