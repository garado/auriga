# █▀ █▀█ █▀█ █▀
# ▄█ █▄█ █▀▀ ▄█

{ inputs, ... }:
{
  flake.modules.nixos.sops = {
    imports = [ inputs.sops-nix.nixosModules.sops ];

    sops.defaultSopsFile = ./secrets.yaml;
  };
}
