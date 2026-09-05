# █ █▀█ █░█ █▀█ █▄░█ █▀▀
# █ █▀▀ █▀█ █▄█ █░▀█ ██▄

# Connecting iPhone over USB.

{
  flake.modules.nixos.iphone-connect =
    { pkgs, ... }:
    {
      # Multiplexes USB connections to iPhone, so multiple things
      # can interact with the device at once (mounting filesystem,
      # syncing photos, running a backup tool, etc.)
      services.usbmuxd = {
        enable = true;
        package = pkgs.usbmuxd2;
      };

      environment.systemPackages = with pkgs; [
        libimobiledevice # implements iOS communication protocols
        ifuse # mounts iPhone using those protocols
      ];
    };
}
