# ▄▀█ █▀ ▀█▀ ▄▀█ █▀█ █ █▀█ █▄░█
# █▀█ ▄█ ░█░ █▀█ █▀▄ █ █▄█ █░▀█

# Framework 13. Daily driver.

{ config, inputs, ... }:
{
  # modules ---------------------------------------------------------------------
  flake.modules.nixos."hosts/astarion" =
    { pkgs, ... }:
    {
      imports = [
        ../../pre-dendritic/hosts/astarion/nixos/hardware-configuration.nix
      ]
      ++ (with config.flake.modules.nixos; [
        audio
        bluetooth
        cli-tools
        desktop
        editor
        fonts
        git
        guitarix
        home-manager
        hugo
        hyprland
        iphone-connect
        laptop
        locale
        mdns
        mpd
        networkmanager
        nix-settings
        obsidian # TODO remove after migrating data out of obsidian
        sops
        steam
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
          kitty
          labyrinthine
          ledger
          lf
          mpd
          nvim
          zsh
        ];
        home.stateVersion = "24.11";

        # let home-manager manage/upgrade itself
        programs.home-manager.enable = true;

        # reload systemd user services more gracefully on rebuild
        systemd.user.startServices = "sd-switch";

        wayland.windowManager.hyprland.settings.monitor = [
          "eDP-1,2256x1504@59.99900,0x1080,1"
        ];

        wayland.windowManager.hyprland.settings.exec-once = [
          "sleep 1 && swww-daemon &"
          "labyrinthine &"
        ];

        services.gammastep = {
          enable = true;
          provider = "manual";
          latitude = 37.6500;
          longitude = -122.3200;
        };
      };
      # /modules --------------------------------------------------------------------

      # packages --------------------------------------------------------------------
      environment.systemPackages = with pkgs; [
        signal-desktop
        xournalpp
        spotdl

        framework-tool
        mpv
        firefox
        gthumb
        imagemagick
        zathura
        gimp
        sox
        audacity
        ffmpeg
        shotcut
        obs-studio

        vim

        yt-dlp
        id3v2
        cmus
        cmusfm
        pkgs.python311Packages.mutagen

        lmms

        prismlauncher
        wineWowPackages.stable
      ];
      # /packages -------------------------------------------------------------------

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

      services.auriga-syncthing = {
        enable = true;
        user = "alexis";
        musicPath = /home/alexis/Music/Library;
        playlistPath = /home/alexis/Music/Playlists/cmus-playlist-defs/playlists;
        playlistMetaPath = /home/alexis/.config/labyrinthine/playlists;
        ledgerPath = /home/alexis/Documents/ledger/data;
      };

      # TODO systemd.services.lock-on-sleep (lock screen before sleep)
      # TODO services.logind lid switch / idle suspend (was broken on hyprland; use hypridle instead)

      # allow running framework-tool (framework hw control) without a sudo
      # password prompt every time
      security.sudo.extraRules = [
        {
          users = [ "alexis" ];
          commands = [
            {
              command = "/run/current-system/sw/bin/framework-tool";
              options = [ "NOPASSWD" ];
            }
          ];
        }
      ];

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
