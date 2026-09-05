# █ █▀▄▀█ █▀▄▀█ █ █▀▀ █░█
# █ █░▀░█ █░▀░█ █ █▄▄ █▀█

# Google Photos alternative. Native NixOS service, not docker-compose.

{
  flake.modules.nixos.immich = {
    # valkey's build-time test suite (specifically the dual-channel-replication
    # integration test) is flaky under the Nix build sandbox and repeatedly
    # fails the build for immich-machine-learning's aiocache dependency.
    nixpkgs.overlays = [
      (final: prev: {
        valkey = prev.valkey.overrideAttrs (_: {
          doCheck = false;
        });
      })
    ];

    services.immich = {
      enable = true;
      mediaLocation = "/var/lib/immich";
      host = "0.0.0.0"; # needed for tailscale access
    };

    networking.firewall.allowedTCPPorts = [ 2283 ];
  };
}
