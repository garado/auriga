# █▀▄▀█ ▄▀█ █▀▀ █░█ █ █▄░█ █▀▀   █▀█ █▀▀ █▀█ █▀█ █▀█ ▀█▀
# █░▀░█ █▀█ █▄▄ █▀█ █ █░▀█ ██▄   █▀▄ ██▄ █▀▀ █▄█ █▀▄ ░█░

# see machine_report.sh

{ pkgs, lib, ... }:
let
  machine-report = pkgs.writeShellApplication {
    name = "machine-report";
    runtimeInputs = with pkgs; [
      gnugrep
      gawk
      util-linux
      iproute2
      nettools
      shadow
      procps
      systemd
      curl
      jq
    ];
    text = builtins.readFile ./machine_report.sh;
    excludeShellChecks = [
      "SC2034" # some vars only used indirectly, via max_length's "$@"
      "SC2312" # command substitution masking return values, not worth fixing in vendored script
      "SC1091" # can't follow /etc/os-release at build time, fine at runtime
      "SC2207" # net_dns_ip array-from-command-sub, vendored script
      "SC2143" # grep -q vs [ -n ... ], vendored script
      "SC2004" # $/${} on arithmetic vars, vendored script
      "SC2086" # unquoted expansions, vendored script
    ];
  };
in
{
  environment.systemPackages = [ machine-report ];
  environment.interactiveShellInit = ''
    machine-report
  '';
}
