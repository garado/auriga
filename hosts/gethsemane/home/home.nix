
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

  home.sessionVariables.EDITOR = "nvim";

  programs.home-manager.enable = true;
  systemd.user.startServices = "sd-switch";
  home.stateVersion = "24.11";
}
