
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
      # ee = "editor-open";
      "<enter>" = "open";
      "x" = "cut";
      "d" = "delete";
      "c" = "copyPath";
      "s" = "playkill";
      "m" = "mkdir";
      "b" = "bulkrename";
    };

    commands = {
      editor-open = ''$$EDITOR $f'';

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
      
      playkill = ''
      ''${{
        pkill -f "play"
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
        elif [[ "$( ${pkgs.file}/bin/file -Lb --mime-type "$file")" =~ ^audio ]]; then
            pkill play
            play "$file" & disown
            exit 0
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
