# █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀ █░█ █▀█ ▄▀█ ▀█▀ █ █▀█ █▄░█
# █▄▄ █▄█ █░▀█ █▀░ █ █▄█ █▄█ █▀▄ █▀█ ░█░ █ █▄█ █░▀█

# This turns every `flake.modules.nixos."hosts/*"` into a real
# `nixosConfigurations.<name>` that nixos-rebuild can use.
#
# The Python equivalent of this (because I really struggle with Nix syntax) is:
#
# ```py
# hostname = path.removeprefix("hosts/")
#
# flake["nixosConfigurations"] = {
#   hostname: nixos_system(
#     special_args={"inputs": inputs},
#     modules=[module],
#     networking.hostName=hostname,
#   )
#   for path, module in config["flake"]["modules"]["nixos"].items()
#   if path.startswith("hosts/")
# }
# ```

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
        modules = [
          module
          { networking.hostName = lib.mkDefault (lib.removePrefix "hosts/" path); }
        ];
      }
    )
  ) (lib.filterAttrs (n: _: lib.hasPrefix "hosts/" n) config.flake.modules.nixos);
}
