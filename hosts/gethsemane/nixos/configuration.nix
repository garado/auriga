{ config, pkgs, inputs, ... }:

{
  imports = [ ./hardware-configuration.nix ];

  users.users.vessel = {
    isNormalUser = true;
    description = "vessel";
    extraGroups = [ "networkmanager" "wheel" ];
    packages = with pkgs; [

    ];
  };

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Networking and ssh access
  networking.hostName = "gethsemane";
  networking.firewall.allowedTCPPorts = [ 22 ];
  networking.firewall.allowedUDPPorts = [ 5353 ];
  services.openssh = {
    enable = true;
    settings = {
      PermitRootLogin = "no";
      PasswordAuthentication = true; # TODO set to false after ssh
    };
    ports = [ 22 ];
  };
  networking.networkmanager.enable = true;

  # Access with `ssh@vessel.gethsemane`
  services.avahi = {
    enable = true;
    nssmdns4 = true;
    publish = {
      enable = true;
      addresses = true;
      workstation = true;
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
