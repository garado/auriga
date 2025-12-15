
# █▀▄ █▀█ █▀▀ █▀▄ █▀▀ █▀▀   █▄░█ █░█ █ █▀▄▀█
# █▄▀ █▀▄ ██▄ █▄▀ █▄█ ██▄ ▄ █░▀█ ▀▄▀ █ █░▀░█

# A neovim configuration managed with NixCats.
# https://nixcats.org/

# Instead of using the nvim pkgs from nixpkgs, NixCats lets you define
# your own custom neovim package. NixCats lets you use Nix to manage nvim
# dependencies (plugins, LSPs, etc.) while letting you configure everything
# else in Lua.

{ config, lib, inputs, ... }: let
  utils = inputs.nixCats.utils;
in {
  imports = [
    inputs.nixCats.homeModule
  ];
  config = {
    nixCats = {
      enable = true;

      addOverlays = [
        (utils.standardPluginOverlay inputs)
      ];

      packageNames = [ "dredge.nvim" ];

      luaPath = ./dredge.lua;

      categoryDefinitions.replace = ({ pkgs, settings, categories, extra, name, mkPlugin, ... }@packageDef: {
        # Define runtime dependencies
        lspsAndRuntimeDeps = {
          general = with pkgs; [
            lazygit
          ];
          lua = with pkgs; [
            lua-language-server
            stylua
          ];
          nix = with pkgs; [
            nixd
            alejandra
          ];
          go = with pkgs; [
            gopls
            delve
            golint
            golangci-lint
            gotools
            go-tools
            go
          ];
        };

        # Plugins loaded at startup (without packadd)
        startupPlugins = {
          general = with pkgs.vimPlugins; [
            # lazy loading isnt required with a config this small
            # but as a demo, we do it anyway.
            lze
            lzextras
            snacks-nvim
            onedark-nvim
            vim-sleuth
          ];
        };

        # Plugins not loaded at startup (loaded with packadd or autocmds)
        optionalPlugins = {
          go = with pkgs.vimPlugins; [
            nvim-dap-go
          ];
          lua = with pkgs.vimPlugins; [
            lazydev-nvim
          ];
          general = with pkgs.vimPlugins; [
            mini-nvim
            nvim-lspconfig
            vim-startuptime
            blink-cmp
            nvim-treesitter.withAllGrammars
            lualine-nvim
            lualine-lsp-progress
            gitsigns-nvim
            which-key-nvim
            nvim-lint
            conform-nvim
            nvim-dap
            nvim-dap-ui
            nvim-dap-virtual-text
          ];
        };

        # Shared libraries to be added to LD_LIBRARY_PATH
        sharedLibraries = {
          general = with pkgs; [ ];
        };

        # Environment variables available at runtime for plugins
        environmentVariables = {
          # test = {
          #   CATTESTVAR = "It worked!";
          # };
        };

        # categories of the function you would have passed to withPackages
        python3.libraries = {
          # test = [ (_:[]) ];
        };
      });

      # Defining custom nvim package
      packageDefinitions.replace = {
        "dredge.nvim" = {pkgs, name, ... }: {
          settings = {
            wrapRc = false;
            unwrappedCfgPath = "/home/alexis/Github/dotfiles/hosts/astarion/home/nvim/dredge.lua";

            aliases = [ "vim" "homeVim" "nvim" "dredge" ];

            suffix-path = true;
            suffix-LD = true;

            # neovim-unwrapped = inputs.neovim-nightly-overlay.packages.${pkgs.stdenv.hostPlatform.system}.neovim;

            hosts.python3.enable = true;
            hosts.node.enable = true;
          };
          categories = {
            general = true;
            lua = true;
            nix = true;
            go = false;
          };
          extra = {
            nixdExtras.nixpkgs = ''import ${pkgs.path} {}'';
          };
        };
      };
    };
  };
}
