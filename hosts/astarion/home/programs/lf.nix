
# █░░ █▀▀
# █▄▄ █▀░

# Terminal file manager

{ pkgs, config, ... }: {
  programs.lf = {
    enable = true;

    # TODO: Automatically fetch icons
    # xdg.configFile."lf/icons".source = ./icons;

    settings = {
      # icons = true;
    };

    keybindings = {
      "<enter>" = "open";
      "x" = "cut";
      "d" = "delete";
      "c" = "copyPath";
      "s" = "play";
      "m" = "mkdir";
    };

    commands = {
      mkdir = ''
      ''${{
        printf "New directory name: "
        read DIR
        mkdir $DIR
      }}
      '';

      copyPath = ''
      ''${{
        echo -n $fx | xclip -selection clipboard 
      }}
      '';

      play =
      ''
      %{{
        (pkill -9 "play" 2>/dev/null || true) &
        if [[ "$( ${pkgs.file}/bin/file -Lb --mime-type "$f")" =~ ^audio ]]; then
          ${pkgs.sox}/bin/play "$f" </dev/null >/dev/null 2>&1 & disown
        fi
      }}
      '';
    };

    # Image previewing
    extraConfig = 
    let 
      previewer = 
        pkgs.writeShellScriptBin "pv.sh" ''
        file=$1
        w=$2
        h=$3
        x=$4
        y=$5

        if [[ "$( ${pkgs.file}/bin/file -Lb --mime-type "$file")" =~ ^image ]]; then
            ${pkgs.kitty}/bin/kitty +kitten icat --silent --stdin no --transfer-mode file --place "''${w}x''${h}@''${x}x''${y}" "$file" < /dev/null > /dev/tty
            exit 1
        fi

        ${pkgs.pistol}/bin/pistol "$file"
      '';
      cleaner = pkgs.writeShellScriptBin "clean.sh" ''
        ${pkgs.kitty}/bin/kitty +kitten icat --clear --stdin no --silent --transfer-mode file < /dev/null > /dev/tty
      '';
    in
    ''
      set cleaner ${cleaner}/bin/clean.sh
      set previewer ${previewer}/bin/pv.sh
    '';
  };
}
