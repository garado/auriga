# █▄░█ █░█ █ █▀▄▀█
# █░▀█ ▀▄▀ █ █░▀░█

# https://github.com/nix-community/nix4nvchad

{
  flake.modules.homeManager.nvim =
    {
      inputs,
      pkgs,
      ...
    }:
    {
      imports = [ inputs.nix4nvchad.homeManagerModules.nvchad ];

      programs.nvchad = {
        enable = true;
        extraPackages = with pkgs; [
          # Language servers
          clang-tools
          bash-language-server
          typescript-language-server
          nixd
          basedpyright

          # Formatters
          black
          nixfmt
        ];

        # These get symlinked
        extraPlugins = builtins.readFile ./extraPlugins.lua;
        extraConfig = builtins.readFile ./extraConfig.lua;

        hm-activation = true;
        backup = true;
      };
    };
}
