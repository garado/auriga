# █▀ █▀ █░█   █▀ █▀▀ █▀█ █░█ █▀▀ █▀█
# ▄█ ▄█ █▀█   ▄█ ██▄ █▀▄ ▀▄▀ ██▄ █▀▄

# Accepts incoming SSH connections.

{
  flake.modules.nixos.sshd = {
    services.openssh.enable = true;
    networking.firewall.allowedTCPPorts = [ 22 ];
  };
}
