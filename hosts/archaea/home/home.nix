
# █░█ █▀█ █▀▄▀█ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
# █▀█ █▄█ █░▀░█ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄

# Home manager configuration for archaea (Surface Go 2).

{ inputs, lib, config, pkgs, ... }: {

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

  home.stateVersion = "25.11";
}
