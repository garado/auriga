# █▄░█ █░█ █ █▀▄▀█
# █░▀█ ▀▄▀ █ █░▀░█

# https://github.com/nix-community/nix4nvchad

{
  flake.modules.homeManager.nvim =
    {
      config,
      lib,
      inputs,
      pkgs,
      ...
    }:
    {
      imports = [ inputs.nix4nvchad.homeManagerModules.nvchad ];

      options.auriga-nvim = {
        extraConfigFiles = lib.mkOption {
          type = lib.types.listOf lib.types.path;
          default = [ ];
          description = ''
            Additional extraConfig files, appended after the shared extraConfig.lua.
          '';
        };
      };

      config.programs.nvchad = {
        enable = true;
        extraPackages = with pkgs; [
          # Language servers
          bash-language-server
          clang-tools
          nixd
          pyright
          typescript-language-server

          # Formatters
          black
          buildifier
          nixfmt
        ];

        # These get symlinked
        extraPlugins = builtins.readFile ./extraPlugins.lua;
        extraConfig = lib.concatMapStringsSep "\n\n" builtins.readFile (
          [ ./extraConfig.lua ] ++ config.auriga-nvim.extraConfigFiles
        );

        hm-activation = true;
        backup = true;
      };
    };
}
