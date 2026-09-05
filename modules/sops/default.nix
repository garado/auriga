# █▀ █▀█ █▀█ █▀
# ▄█ █▄█ █▀▀ ▄█

{ inputs, ... }:
{
  flake.modules.nixos.sops =
    { pkgs, ... }:
    {
      imports = [ inputs.sops-nix.nixosModules.sops ];

      sops.defaultSopsFile = ./secrets.yaml;

      environment.systemPackages = [ pkgs.sops ];
    };
}
