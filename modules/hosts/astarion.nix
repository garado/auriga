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
      audio
      bluetooth
      desktop
      editor
      fonts
      git
      home-manager
      hyprland
      locale
      nix-settings
      thunar
    ]);

    home-manager.users.alexis = {
      imports = with config.flake.modules.homeManager; [
        git
        hyprland
      ];
      home.stateVersion = "24.11";
    };

    boot.loader.systemd-boot.enable = true;
    boot.loader.efi.canTouchEfiVariables = true;
    networking.hostName = "astarion";

    # the NixOS release this machine was first set up with
    system.stateVersion = "24.11";

    users.users.alexis = {
      isNormalUser = true;
      extraGroups = [ "wheel" ];
      initialPassword = "changeme";
    };
  };
}
