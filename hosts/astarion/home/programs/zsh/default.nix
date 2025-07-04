
# ▀█ █▀ █░█
# █▄ ▄█ █▀█

{ pkgs, config, ... }: {
  imports = [
    ./aliases.nix
  ];

  programs.zsh = {
    enable = true;
    
    # Extra commands to add to .zshrc
    initExtra = ''
      bindkey -v
      bindkey -M viins 'jk' vi-cmd-mode
      autoload zmv
    '';

    # Extra commands to be added to .zshenv
    # envExtra = ''
    # ''; 

    oh-my-zsh = {
      enable = true;
      theme = "theunraveler";
    };
  };
}
