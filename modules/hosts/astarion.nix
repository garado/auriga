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
      guitarix
      home-manager
      hyprland
      iphone-connect
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

    # avoid conflicting/duplicate AMD audio codec drivers
    boot.blacklistedKernelModules = [
      "snd_pci_ps"
      "snd_rn_pci_acp3x"
      "snd_pci_acp3x"
    ];

    # framework13 workarounds
    boot.kernelParams = [
      "amdgpu.abm_level=0" # disable adaptive backlight management (flicker)
      "amdgpu.dcdebugmask=0x10" # disable panel self refresh (flicker)
      "snd_hda_intel.dmic_detect=0" # fix internal mic/speaker misdetection
    ];

    # the NixOS release this machine was first set up with
    system.stateVersion = "24.11";

    users.users.alexis = {
      isNormalUser = true;
      extraGroups = [ "wheel" ];
      initialPassword = "changeme";
    };
  };
}
