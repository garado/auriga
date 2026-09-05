# █▀ █▀ █░█   █▀ █▀▀ █▀█ █░█ █▀▀ █▀█
# ▄█ ▄█ █▀█   ▄█ ██▄ █▀▄ ▀▄▀ ██▄ █▀▄

# Accepts incoming SSH connections.

{
  flake.modules.nixos.sshd = {
    services.openssh = {
      enable = true;
      settings = {
        PermitRootLogin = "no";
        PasswordAuthentication = false;
        KbdInteractiveAuthentication = false;
      };
      ports = [ 22 ];
    };
    networking.firewall.allowedTCPPorts = [ 22 ];
  };
}
