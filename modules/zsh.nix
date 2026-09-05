# ▀█ █▀ █░█
# █▄ ▄█ █▀█

{
  flake.modules.homeManager.zsh = {
    programs.zsh = {
      enable = true;

      oh-my-zsh = {
        enable = true;
        theme = "theunraveler";
      };

      # Extra commands to add to .zshrc
      initContent = ''
        bindkey -v
        bindkey -M viins 'jk' vi-cmd-mode
        autoload zmv

        # Modify prompt if in nix devshell
        if [ -n "$NIX_DEV_SHELL" ]; then
          PROMPT="$PROMPT [$NIX_DEV_SHELL] "
        fi

        lfcd() {
          tmp="$(mktemp)"
          lf -last-dir-path="$tmp" "$@"
          if [ -f "$tmp" ]; then
            dir="$(cat "$tmp")"
            rm -f "$tmp"
            [ -d "$dir" ] && cd "$dir"
          fi
        }
        alias lf="lfcd"
      '';

      shellAliases = {
        # Shell commands
        c = "clear";
        l = "ls -X --group-directories-first";
        lsa = "ls -laX --group-directories-first";
        p = "pwd";
        pclip = "pwd | wl-copy";

        # Quick navigation
        ".." = "cd ..";
        "..." = "cd ../..";
        "...." = "cd ../../..";
        desk = "cd ~/Desktop";
        docs = "cd ~/Documents";
        mus = "cd ~/Music";
        pics = "cd ~/Pictures";
        vids = "cd ~/Videos";
        gth = "cd ~/Github";
        dl = "cd ~/Downloads";

        # Nix
        rebuild = "sudo nixos-rebuild switch --flake .#$(hostname)";
        re = "rebuild";
        ndev = "nix develop --command zsh";

        # Shortcut for terminal programs
        v = "nvim";
        nv = "nvim";

        # Git
        gst = "git status";
        gtc = "git commit";
        gtcm = "git commit -m ";
        gtp = "git push";
        gtd = "git diff";
        gds = "git diff --staged";
        gta = "git add";
        gtl = "git log";
        gtrl = "git reflog";

        # astarion-specific
        dots = "cd ~/Github/dotfiles/";
        tabs = "cd ~/Documents/Music/guitar/";
        cfg = "cd ~/.config";
        edl = "cd $ENCHIRIDION/self/ledger ; nvim 2024/2024.ledger";
        todo = "cd ~/Documents/stickynotes/ ; nvim todo.md";
        py = "python3.11";
        m = "make";
      };
    };
  };
}
