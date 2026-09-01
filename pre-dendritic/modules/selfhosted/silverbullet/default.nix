# █▀ █ █░░ █░█ █▀▀ █▀█ █▄▄ █░█ █░░ █░░ █▀▀ ▀█▀
# ▄█ █ █▄▄ ▀▄▀ ██▄ █▀▄ █▄█ █▄█ █▄▄ █▄▄ ██▄ ░█░

# Self-hosted personal knowledge vault. Like Obsidian, but less bloated.

{ config, pkgs, ... }:
{
  imports = [ ./docker-compose.nix ];
  networking.firewall.allowedTCPPorts = [ 3000 ];

  sops.secrets."cloudflared/silverbullet-token" = { };

  sops.templates."cloudflared-silverbullet-env" = {
    content = ''
      TUNNEL_TOKEN=${config.sops.placeholder."cloudflared/silverbullet-token"}
    '';
  };

  users.users.cloudflared-sb = {
    isSystemUser = true;
    group = "cloudflared-sb";
  };
  users.groups.cloudflared-sb = { };

  systemd.services.cloudflared-silverbullet = {
    description = "Cloudflare Tunnel for SilverBullet";
    wantedBy = [ "multi-user.target" ];
    after = [
      "network-online.target"
      "podman-silverbullet.service"
    ];
    wants = [ "network-online.target" ];
    serviceConfig = {
      ExecStart = "${pkgs.cloudflared}/bin/cloudflared tunnel --no-autoupdate run --token $TUNNEL_TOKEN";
      EnvironmentFile = config.sops.templates."cloudflared-silverbullet-env".path;
      Restart = "on-failure";
      User = "cloudflared-sb";
    };
  };
}
