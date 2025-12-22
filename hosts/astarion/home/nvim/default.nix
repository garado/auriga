
# █▄░█ █░█ █ █▀▄▀█
# █░▀█ ▀▄▀ █ █░▀░█

# A neovim configuration managed with NixCats.
# https://nixcats.org/

# Instead of using the nvim pkgs from nixpkgs, NixCats lets you define
# your own custom neovim package. NixCats lets you use Nix to manage nvim
# dependencies (plugins, LSPs, etc.) while letting you configure everything
# else in Lua.

{ config, lib, inputs, pkgs, ... }: let
  utils = inputs.nixCats.utils;

  pythonEnv = pkgs.python313.withPackages (ps: with ps; [
    pygobject3
    pygobject-stubs
  ]);

  gtkEnv = pkgs.buildEnv {
    name = "gtk-env";
    paths = [ pkgs.gtk4 pkgs.gobject-introspection ];
  };
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
          python = with pkgs; [
            (basedpyright.overrideAttrs (old: {
              buildInputs = old.buildInputs or [] ++ [ pythonEnv ];
            }))
            ruff
            gobject-introspection
            gtk4
            clang-tools
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
            nvim-lspconfig
            trouble-nvim        # better diagnostics viewing
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
            vim-startuptime
            blink-cmp
            blink-pairs
            lualine-lsp-progress
            gitsigns-nvim
            which-key-nvim
            nvim-lint
            conform-nvim
            nvim-dap
            nvim-dap-ui
            nvim-dap-virtual-text

            nvim-treesitter.withAllGrammars
          ];
        };

        # Shared libraries to be added to LD_LIBRARY_PATH
        sharedLibraries = {
          general = with pkgs; [
            gobject-introspection
            gtk4
          ];
        };

        # Environment variables available at runtime for plugins
        environmentVariables = {
          saturn = {
            PYGOBJECT_STUB_CONFIG = "Gtk4";
            GI_TYPELIB_PATH = "${gtkEnv}/lib/girepository-1.0";
          };
        };

        # categories of the function you would have passed to withPackages
        python3.libraries = {
          saturn = ps: with ps; [
            pygobject3
            pygobject-stubs
          ];
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
            python = true;
            saturn = true;
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
