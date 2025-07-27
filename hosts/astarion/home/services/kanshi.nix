
# █▄▀ ▄▀█ █▄░█ █▀ █░█ █
# █░█ █▀█ █░▀█ ▄█ █▀█ █

# Multi-monitor configurations

{ config, lib, pkgs, ... }: {
  services.kanshi = {
    enable = true;

    settings = [
    {
      profile.name = "laptop";
      profile.outputs = [
      {
        criteria = "eDP-11";
        status = "enable";
        mode = "2256x1504";
        position = "0,0";
      }
      ];
    }

    {
      profile.name = "docked";
      profile.outputs = [
      {
        criteria = "eDP-11";
        status = "enable";
        mode = "2256x1504";
        position = "0,1080";
      }
      {
        criteria = "DP-11";
        status = "enable";
        mode = "2560x1440";
        position = "0,0";
      }
      ];
    }

    {
      profile.name = "external-only";
      profile.outputs = [
      {
        criteria = "eDP-11";
        status = "disable";
      }
      {
        criteria = "DP-11";
        status = "enable";
        mode = "2560x1440";
        position = "0,0";
      }
      ];
    }
    ];
  };
}
