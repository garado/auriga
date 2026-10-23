# ▀█▀ ▄▀█ █ █░░ █▀ █▀▀ ▄▀█ █░░ █▀▀
# ░█░ █▀█ █ █▄▄ ▄█ █▄▄ █▀█ █▄▄ ██▄

{
  flake.modules.nixos.tailscale =
    { config, ... }:
    {
      sops.secrets."tailscale/key".owner = "root";

      services.tailscale = {
        enable = true;
        authKeyFile = config.sops.secrets."tailscale/key".path;
      };

      # fixes no internet after mullvad vpn exit node
      # https://github.com/tailscale/tailscale/issues/10319
      networking.firewall.checkReversePath = "loose";
    };
}
