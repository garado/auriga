# ▄▀█ █▀ ▀█▀ ▄▀█ █▀█ █ █▀█ █▄░█
# █▀█ ▄█ ░█░ █▀█ █▀▄ █ █▄█ █░▀█

# Framework 13. Daily driver.

{ config, inputs, ... }:
{
  flake.modules.nixos."hosts/astarion" = {
    imports = [
      ../../pre-dendritic/hosts/astarion/nixos/hardware-configuration.nix
    ]
    ++ (with config.flake.modules.nixos; [
      fonts
    ]);

    boot.loader.systemd-boot.enable = true;
    boot.loader.efi.canTouchEfiVariables = true;
    networking.hostName = "astarion";
    system.stateVersion = "24.11";

    users.users.alexis = {
      isNormalUser = true;
      extraGroups = [ "wheel" ];
      initialPassword = "changeme";
    };
  };
}
