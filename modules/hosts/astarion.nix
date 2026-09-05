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
      mdns
      nix-settings
      sops
      steam
      tailscale
      thunar
      unfree
    ]);

    home-manager.users.alexis = {
      imports = with config.flake.modules.homeManager; [
        git
        gtk
        hyprland
        kitty
        lf
        nvim
        zsh
      ];
      home.stateVersion = "24.11";
    };

    # secrets management
    sops.age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ];
    services.tailscale.useRoutingFeatures = "client";

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
