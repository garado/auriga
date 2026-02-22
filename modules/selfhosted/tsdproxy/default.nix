
# ▀█▀ █▀ █▀▄ █▀█ █▀█ █▀█ ▀▄▀ █▄█
# ░█░ ▄█ █▄▀ █▀▀ █▀▄ █▄█ █░█ ░█░

# tsdproxy is a tool used to assign distinct subdomains to services on a tailnet.

{ ... }: {
  imports = [
    ./docker-compose.nix
  ];

  networking.firewall.allowedTCPPorts = [ 8080 ];

  # create docker-compatible socket so tsdproxy can talk to podman as if it were docker
  virtualisation.podman.dockerSocket.enable = true;

  # copy yaml config to correct location
  environment.etc."tsdproxy/config.yaml".source = ./tsdproxy.yaml;
}
