# ▀█ █▀ █░█
# █▄ ▄█ █▀█

{
  flake.modules.nixos.zsh =
    { pkgs, ... }:
    {
      programs.zsh.enable = true;
      users.defaultUserShell = pkgs.zsh;
    };

  flake.modules.homeManager.zsh =
    { self, ... }:
    {
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

          # make lf always cd to wherever you exit from
          lfcd() {
            tmp="$(mktemp)"
            command lf -last-dir-path="$tmp" "$@"
            if [ -f "$tmp" ]; then
              dir="$(cat "$tmp")"
              rm -f "$tmp"
              [ -d "$dir" ] && cd "$dir"
            fi
          }
          alias lf="lfcd"

          # copy stdin to local clipboard (OSC52 for ssh support)
          osc52-copy() {
            local data
            data="$(base64 | tr -d '\n')"
            if [ -n "$TMUX" ]; then
              printf '\033Ptmux;\033\033]52;c;%s\a\033\\' "$data"
            else
              printf '\033]52;c;%s\a' "$data"
            fi
          }
        '';

        shellAliases = {
          # Shell commands
          c = "clear";
          l = "ls -X --group-directories-first";
          lsa = "ls -laX --group-directories-first";
          p = "pwd";
          pclip = "pwd | osc52-copy";
          mkdp = "mkdir -p ";
          mkd = "mkdir";
          zsrc = "source ~/.zshrc";

          # Quick navigation
          ".." = "cd ..";
          "..." = "cd ../..";
          "...." = "cd ../../..";
          cfg = "cd ~/.config";
          desk = "cd ~/Desktop";
          dl = "cd ~/Downloads";
          docs = "cd ~/Documents";
          gth = "cd ~/Github";
          mus = "cd ~/Music";
          pics = "cd ~/Pictures";
          vids = "cd ~/Videos";

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
          gad = "git add";
          gtl = "git log";
          gtrl = "git reflog";
          gwtl = "git worktree list";
          gstat = "echo '--- UNSTAGED ---'; git --no-pager diff --stat; echo '---- STAGED ----'; git --no-pager diff --staged --stat ; echo '----------------'";

          # Devshells
          cshell = "nix-shell ${self}/devshell/c-shell.nix";
          pyshell = "nix-shell ${self}/devshell/python-shell.nix";
          texshell = "nix-shell ${self}/devshell/latex-shell.nix";

          # Common across hosts
          dots = "cd ~/Github/dotfiles/";
          m = "make";
        };
      };
    };
}
