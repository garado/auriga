# █░█ █▀█ █▀▄▀█ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
# █▀█ █▄█ █░▀░█ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄

# Home manager configuration for archaea (Surface Go 2).

{
  inputs,
  lib,
  config,
  pkgs,
  ...
}:
{

  imports = [
    ./zsh
  ];

  # Hyprland: host-specific display and startup config
  wayland.windowManager.hyprland.settings = {
    monitor = [
      "eDP-1,1920x1280@60,0x0,1"
    ];
    exec-once = [
      "sleep 1 && swww-daemon &"
    ];
    cursor = {
      no_warps = false;
      warp_on_change_workspace = true;
      default_monitor = "eDP-1";
    };
  };

  home = {
    username = "alexis";
    homeDirectory = "/home/alexis";

    packages = with pkgs; [
      mpc
    ];

    pointerCursor = {
      gtk.enable = true;
      x11.enable = true;
      package = pkgs.bibata-cursors;
      name = "Bibata-Modern-Classic";
      size = 24;
    };
  };

  gtk = {
    enable = true;
    cursorTheme = {
      name = "Bibata-Modern-Classic";
      package = pkgs.bibata-cursors;
    };
    font.name = "Karla";
    font.size = 14;
  };

  programs.git = {
    enable = true;
    settings = {
      user.name = "garado";
      user.email = "alexisgarado@gmail.com";
      core.quotepath = false;
      i18n.commitencoding = "utf-8";
      i18n.logoutputencoding = "utf-8";
    };
  };

  services.gammastep = {
    enable = true;
    provider = "manual";
    latitude = 37.5485;
    longitude = -121.9886;
  };

  programs.home-manager.enable = true;

  systemd.user.startServices = "sd-switch";

  home.stateVersion = "23.11";
}
