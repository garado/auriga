# █▀▀ █░░ █   ▀█▀ █▀█ █▀█ █░░ █▀
# █▄▄ █▄▄ █   ░█░ █▄█ █▄█ █▄▄ ▄█

{
  flake.modules.nixos.cli-tools =
    { pkgs, ... }:
    {
      environment.systemPackages = with pkgs; [
        ripgrep

        zip
        unzip

        wget

        tree

        htop
        btop

        radeontop
        acpi
        exiftool
        cava
      ];
    };
}
