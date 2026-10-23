# ▀█ █▀█ █▀▄▀█ █▄▄ █▀█ █ █▀▄
# █▄ █▄█ █░▀░█ █▄█ █▄█ █ █▄▀

# Project Zomboid dedicated server on LAN/Tailscale.
# https://github.com/Cairnstew/nixos-projectzomboid-servers

{ inputs, ... }:

{
  flake.modules.nixos.zomboid =
    { config, lib, ... }:
    {
      imports = [ inputs.project-zomboid-servers.nixosModules.project-zomboid-servers ];

      unfreePackages = [
        "project-zomboid-server"
        "steamcmd"
        "steam-run"
        "steam-unwrapped"
      ];

      sops.secrets."zomboid/admin-password" = { };
      sops.secrets."zomboid/server-password" = { };

      services.project-zomboid-servers = {
        enable = true;

        dataDir = "/var/lib/project-zomboid";

        modpacks = inputs.project-zomboid-servers.modpacks;

        servers.main = {
          modpack = "viewpoint";

          defaultPort = 16261;
          udpPort = 16262;
          openFirewall = true;

          public = false;
          publicName = "gethsemane";

          passwordFile = config.sops.secrets."zomboid/server-password".path;

          adminAccount = {
            username = "vessel";
            passwordFile = config.sops.secrets."zomboid/admin-password".path;
          };

          jvmOpts = "-Xmx6G -Xms3G";
          hardware = {
            memoryMax = "8G";
            memoryHigh = "7G";
          };

          restart = "always";
        };
      };
    };
}
