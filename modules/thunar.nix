# ▀█▀ █░█ █░█ █▄░█ ▄▀█ █▀█
# ░█░ █▀█ █▄█ █░▀█ █▀█ █▀▄

{
  flake.modules.nixos.thunar = {
    programs.thunar.enable = true;
    services.gvfs.enable = true; # trash, mounting, network shares
    services.tumbler.enable = true; # thumbnails
  };
}
