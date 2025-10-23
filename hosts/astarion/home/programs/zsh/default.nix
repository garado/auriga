
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

      # Modify prompt if in nix devshell
      if [ -n "$NIX_DEV_SHELL" ]; then
        PROMPT="$PROMPT [$NIX_DEV_SHELL]"
      fi
    '';

    oh-my-zsh = {
      enable = true;
      theme = "theunraveler";
    };
  };
}
