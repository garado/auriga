# █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀ █░█ █▀█ ▄▀█ ▀█▀ █ █▀█ █▄░█
# █▄▄ █▄█ █░▀█ █▀░ █ █▄█ █▄█ █▀▄ █▀█ ░█░ █ █▄█ █░▀█

# This turns every `flake.modules.nixos."hosts/*"` into a real
# `nixosConfigurations.<name>` that nixos-rebuild can use.
#
# The Python equivalent of this (because I really struggle with
# Nix syntax) is:
#
# flake["nixosConfigurations"] = {
#   path.removeprefix("hosts/"): nixos_system(
#     special_args={"inputs": inputs},
#     modules=[module],
#   )
#   for path, module in config["flake"]["modules"]["nixos"].items()
#   if path.startswith("hosts/")
# }

{
  config,
  inputs,
  lib,
  ...
}:
{
  flake.nixosConfigurations = lib.mapAttrs' (
    path: module:
    lib.nameValuePair (lib.removePrefix "hosts/" path) (
      inputs.nixpkgs.lib.nixosSystem {
        specialArgs = { inherit inputs; };
        modules = [ module ];
      }
    )
  ) (lib.filterAttrs (n: _: lib.hasPrefix "hosts/" n) config.flake.modules.nixos);
}
