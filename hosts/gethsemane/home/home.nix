
# █░█ █▀█ █▀▄▀█ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
# █▀█ █▄█ █░▀░█ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄

# Home manager configuration for gethsemane.

{ self, inputs, lib, config, pkgs, ... }: {
  imports = [
  ];

  home.username = "vessel";
  home.homeDirectory = "/home/vessel";
  home.packages = with pkgs; [
    git
  ];

  programs.home-manager.enable = true;
  systemd.user.startServices = "sd-switch";
  home.stateVersion = "24.11";
}
