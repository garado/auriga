# ▄▀█ █▀█ █▀▀ █░█ ▄▀█ █▀▀ ▄▀█
# █▀█ █▀▄ █▄▄ █▀█ █▀█ ██▄ █▀█

# Surface Go 2. Used as tablet for drawing and as a travel laptop.

{ config, ... }:
{
  flake.modules.nixos."hosts/archaea" =
    { pkgs, lib, ... }:
    {
      # modules ---------------------------------------------------------------------
      imports = [
        ./_hardware-configuration.nix
      ]
      ++ (with config.flake.modules.nixos; [
        audio
        bluetooth
        cli-tools
        editor
        fonts
        git
        graphical-session
        home-manager
        hyprland
        laptop
        locale
        mdns
        mpd
        networkmanager
        nix-settings
        sops
        syncthing
        tailscale
        thunar
        unfree
        zsh
      ]);

      home-manager.users.alexis = {
        imports = with config.flake.modules.homeManager; [
          git
          gtk
          hyprland
          lf
          mpd
          zsh
        ];
      };
      # /modules --------------------------------------------------------------------

      home-manager.users.alexis = {
        home.stateVersion = "23.11";

        # let home-manager manage/upgrade itself
        programs.home-manager.enable = true;

        # reload systemd user services more gracefully on rebuild
        systemd.user.startServices = "sd-switch";

        wayland.windowManager.hyprland.settings = {
          monitor = [
            "eDP-1,1920x1280@60,0x0,1"
          ];

          exec-once = [
            "sleep 1 && awww-daemon &"
          ];

          cursor = {
            no_warps = false;
            warp_on_change_workspace = true;
            default_monitor = "eDP-1";
          };
        };

        services.gammastep = {
          enable = true;
          provider = "manual";
          latitude = 37.5485;
          longitude = -121.9886;
        };
      };

      # packages --------------------------------------------------------------------
      environment.systemPackages = with pkgs; [
        mpv
        firefox
        imagemagick
        zathura
        ffmpeg
        xournalpp
        drawing

        kitty
        vim

        grimblast
      ];
      # /packages -------------------------------------------------------------------

      # secrets management
      sops.age.sshKeyPaths = [ "/etc/ssh/ssh_host_ed25519_key" ];
      services.tailscale.useRoutingFeatures = "client";

      boot.loader.systemd-boot.enable = true;
      boot.loader.efi.canTouchEfiVariables = true;

      # portable device: auto-detect timezone rather than the shared
      # locale module's hardcoded America/Los_Angeles
      services.automatic-timezoned.enable = true;
      time.timeZone = lib.mkForce null;

      # was working pre-migration; unverified whether Hyprland/Wayland broke
      # this the same way it did on astarion
      services.logind.settings.Login = {
        handleLidSwitch = "suspend";
        extraConfig = ''
          IdleAction=suspend
          IdleActionSec=10min
        '';
      };

      # the NixOS release this machine was first set up with
      system.stateVersion = "23.11";

      services.auriga-syncthing = {
        enable = true;
        user = "alexis";
      };

      users.users.alexis = {
        isNormalUser = true;
        extraGroups = [
          "wheel"
          "networkmanager"
          "audio"
        ];
        initialPassword = "changeme"; # TODO swap for hashedPasswordFile (sops secret)
      };
    };
}
