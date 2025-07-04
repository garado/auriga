
# █▀█ ▄▀█ █▀▀ █▄▀ ▄▀█ █▀▀ █▀▀ █▀
# █▀▀ █▀█ █▄▄ █░█ █▀█ █▄█ ██▄ ▄█

{ inputs, lib, config, pkgs, ... }: {
  imports = [
    # ./gtk.nix
    ./hyprland.nix
    ./kitty
    ./lf.nix
    ./newsboat.nix
    ./nvim
    # ./qutebrowser.nix
    ./taskwarrior.nix
    ./wpaperd.nix
    ./zsh
  ];
}
