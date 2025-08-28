
# ▀█ █▀ █░█
# █▄ ▄█ █▀█

{ pkgs, config, ... }: {
  imports = [
    ./aliases.nix
  ];

  programs.zsh = {
    enable = true;
    
    # Extra commands to add to .zshrc
    initContent = ''
      bindkey -v
      bindkey -M viins 'jk' vi-cmd-mode
      autoload zmv
    '';

    oh-my-zsh = {
      enable = true;
      theme = "theunraveler";
    };
  };
}
