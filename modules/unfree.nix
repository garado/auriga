# █░█ █▄░█ █▀▀ █▀█ █▀▀ █▀▀
# █▄█ █░▀█ █▀░ █▀▄ ██▄ ██▄

# Nix's `allowUnfreePredicate` option doesn't merge across files.
# This declares a custom option called `unfreePackages`, which CAN
# be merged, and sets `allowUnfreePredicate` = `unfreePackages`.

{
  flake.modules.nixos.unfree =
    { lib, config, ... }:
    {
      options.unfreePackages = lib.mkOption {
        type = lib.types.listOf lib.types.str;
        default = [ ];
        description = "Package names allowed despite being unfree.";
      };

      config.nixpkgs.config.allowUnfreePredicate =
        pkg: builtins.elem (lib.getName pkg) config.unfreePackages;
    };
}
