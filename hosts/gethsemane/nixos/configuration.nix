{ config, pkgs, inputs, ... }:

{
  imports = [ ./hardware-configuration.nix ];

  # Networking and ssh access
  networking.hostName = "gethsemane";
  services.openssh = {
    enable = true;
    settings = {
      PermitRootLogin = "no";
      PasswordAuthentication = true; # TODO set to false after ssh
    };
  };

  # No sleeping
  services.logind = {
    lidSwitch = "ignore";
    lidSwitchExternalPower = "ignore";
    lidSwitchDocked = "ignore";
  };

  # Power management
  powerManagement.enable = true;
  services.thermald.enable = true;
}
