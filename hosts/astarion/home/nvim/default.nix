
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
            alpha-nvim          # aesthetic startup screen
            bufferline-nvim     # tab bar
            nvim-web-devicons   # small dependency needed by other plugins
            vim-sleuth          # small utility plugin
            lze lzextras        # lazy loading
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
            nvim-numbertoggle   # auto switch between relative/absolute line numbers
            nvim-tree-lua       # sidebar file browser
            telescope-nvim      # find, filter, preview, pick
            better-escape-nvim  # jk to escape
            lualine-nvim        # statusline
            snacks-nvim         # qol improvements
            comment-nvim        # comments

            mini-nvim
            nvim-lspconfig
            vim-startuptime
            blink-cmp
            lualine-lsp-progress
            gitsigns-nvim
            which-key-nvim
            nvim-lint
            conform-nvim
            nvim-dap
            nvim-dap-ui
            nvim-dap-virtual-text

            nvim-treesitter
            # nvim-treesitter-parsers.zsh  # in 25.11
            nvim-treesitter-parsers.xml
            nvim-treesitter-parsers.vim
            nvim-treesitter-parsers.typescript
            nvim-treesitter-parsers.tsv
            nvim-treesitter-parsers.scss
            nvim-treesitter-parsers.regex
            nvim-treesitter-parsers.nix
            nvim-treesitter-parsers.python
            nvim-treesitter-parsers.markdown
            nvim-treesitter-parsers.lua
            nvim-treesitter-parsers.ledger
            nvim-treesitter-parsers.javascript
            nvim-treesitter-parsers.css
            nvim-treesitter-parsers.diff
            nvim-treesitter-parsers.cpp
            nvim-treesitter-parsers.cmake
            nvim-treesitter-parsers.c
            nvim-treesitter-parsers.bash
            nvim-treesitter-parsers.awk
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

            aliases = [ "vim" "nvim" "dredge" ];

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
