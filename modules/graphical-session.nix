# █▀▀ █▀█ ▄▀█ █▀█ █░█ █ █▀▀ ▄▀█ █░░   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█
# █▄█ █▀▄ █▀█ █▀▀ █▀█ █ █▄▄ █▀█ █▄▄   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█

{
  flake.modules.nixos.graphical-session =
    { pkgs, ... }:
    {
      services.xserver.enable = true;

      services.greetd = {
        enable = true;
        settings.default_session = {
          command = "${pkgs.tuigreet}/bin/tuigreet --time --cmd start-hyprland";
          user = "greeter";
        };
      };

      # Secrets keyring, unlocked at login by greetd
      services.gnome.gnome-keyring.enable = true;
      security.pam.services.greetd.enableGnomeKeyring = true;

      xdg.portal = {
        enable = true;
        extraPortals = [
          pkgs.xdg-desktop-portal-hyprland
          pkgs.xdg-desktop-portal-gtk
        ];
        config.common.default = "*";
      };
    };
}
