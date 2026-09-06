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
    ];
  };
in
{
  environment.systemPackages = [ machine-report ];
  environment.interactiveShellInit = ''
    machine-report
  '';
}
