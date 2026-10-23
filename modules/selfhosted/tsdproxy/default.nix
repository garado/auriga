# ▀█▀ █▀ █▀▄ █▀█ █▀█ █▀█ ▀▄▀ █▄█
# ░█░ ▄█ █▄▀ █▀▀ █▀▄ █▄█ █░█ ░█░

# tsdproxy is a tool used to assign distinct subdomains to services on a tailnet.

{
  flake.modules.nixos.tsdproxy = {
    imports = [ ./_docker-compose.nix ];

    networking.firewall.interfaces."tailscale0".allowedTCPPorts = [ 8080 ];

    systemd.services."podman-tsdproxy-tsdproxy" = {
      after = [ "podman.socket" ];
      requires = [ "podman.socket" ];
    };

    # create docker-compatible socket so tsdproxy can talk to podman as if it were docker
    virtualisation.podman.dockerSocket.enable = true;

    # copy yaml configs to correct location
    environment.etc."tsdproxy/tsdproxy.yaml".source = ./tsdproxy.yaml;
    environment.etc."tsdproxy/proxies.yaml".source = ./proxies.yaml;
  };
}
