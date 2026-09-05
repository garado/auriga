# █░░ ▄▀█ █▀█ ▀█▀ █▀█ █▀█
# █▄▄ █▀█ █▀▀ ░█░ █▄█ █▀▀

# Laptop-specific hardware/power management. Not for headless hosts.
# TODO lock on lid close
# TODO lock after idle

{
  flake.modules.nixos.laptop = {
    services.upower.enable = true; # battery/power info over dbus
    services.power-profiles-daemon.enable = true; # performance/balanced/power-saver switching
  };
}
