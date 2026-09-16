# █▀▄▀█ █▀█ █▀ █░█
# █░▀░█ █▄█ ▄█ █▀█

# Remote shell for flaky/high-latency connections

{
  flake.modules.nixos.mosh =
    {
      pkgs,
      ...
    }:
    {
      environment.systemPackages = [ pkgs.mosh ];

      # scoped to tailscale0 only
      networking.firewall.interfaces."tailscale0".allowedUDPPortRanges = [
        {
          from = 60000;
          to = 60010;
        }
      ];
    };
}
