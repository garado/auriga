# █░█ █▀█ █▀▄▀█ █▀▀ █▄▄ █▀█ ▀▄▀ █▀▀
# █▀█ █▄█ █░▀░█ ██▄ █▄█ █▄█ █░█ █▀░

# Home inventory management system.

{
  flake.modules.nixos.homebox = {
    imports = [ ./_docker-compose.nix ];
  };
}
