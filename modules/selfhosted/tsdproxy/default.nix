
# ▀█▀ █▀ █▀▄ █▀█ █▀█ █▀█ ▀▄▀ █▄█
# ░█░ ▄█ █▄▀ █▀▀ █▀▄ █▄█ █░█ ░█░

# tsdproxy is a tool used to assign distinct subdomains to services on a tailnet.

{ ... }: {
  imports = [
    ./docker-compose.nix
  ];

  networking.firewall.allowedTCPPorts = [ 8080 ];

  networking.firewall.interfaces."podman+" = {
    allowedTCPPorts = [ 2283 ];
  };

  systemd.services."podman-tsdproxy-tsdproxy" = {
    after = [ "podman.socket" ];
    requires = [ "podman.socket" ];
  };

  # create docker-compatible socket so tsdproxy can talk to podman as if it were docker
  virtualisation.podman.dockerSocket.enable = true;

  # copy yaml configs to correct location
  environment.etc."tsdproxy/tsdproxy.yaml".source = ./tsdproxy.yaml;
  environment.etc."tsdproxy/proxies.yaml".source = ./proxies.yaml;
}
