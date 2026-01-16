
# █▄░█ █ ▀▄▀ █░█ █▄░█ █░█ █▀▀ █░█ ▄▀█ █▀▄
# █░▀█ █ █░█ ▀▀█ █░▀█ ▀▄▀ █▄▄ █▀█ █▀█ █▄▀

# https://github.com/nix-community/nix4nvchad

{ config, lib, inputs, pkgs, ... }: let
in {
  imports = [
    inputs.nix4nvchad.homeManagerModule
  ];

  programs.nvchad = {
    enable = true;
    extraPackages = with pkgs; [
      # Language servers
      clang-tools
      nodePackages.bash-language-server
      typescript-language-server
      nixd
      (python3.withPackages(ps: with ps; [
        python-lsp-server
        flake8
      ]))
    ];
    extraPlugins = builtins.readFile ./extraPlugins.lua;
    extraConfig = builtins.readFile ./extraConfig.lua;
    hm-activation = true;
    backup = true;
  };
}
