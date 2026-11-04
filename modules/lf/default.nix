# █░░ █▀▀
# █▄▄ █▀░

# Terminal file manager

{
  flake.modules.homeManager.lf =
    { pkgs, ... }:
    let
      editId3Tags = pkgs.writers.writePython3Bin "edit-id3-tags" {
        libraries = [ pkgs.python3Packages.mutagen ];
        flakeIgnore = [
          "E501"
          "E203"
        ];
      } (builtins.readFile ./edit-id3-tags.py);

      previewId3Tags = pkgs.writers.writePython3Bin "preview-id3-tags" {
        libraries = [ pkgs.python3Packages.mutagen ];
        flakeIgnore = [
          "E501"
          "E203"
        ];
      } (builtins.readFile ./preview-id3-tags.py);
    in
    {
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
          "S" = "playkill";
          "m" = "mkdir";
          "E" = "edittags";
        };

        commands = {
          mkdir = ''
            ''${{
              dir="$(lf -remote 'read "New directory:"')"
              if [ -n "$dir" ]; then
                mkdir -p "$dir"
                lf -remote "send reload"
              fi
            }}
          '';

          copyPath = ''
            ''${{
              echo -n $fx | xclip -selection clipboard
            }}
          '';

          # Edit ID3v2 tags of selected audio file(s) in $EDITOR
          edittags = ''
            ''${{
              IFS=$'\n'

              # collect items in selection that are audio files
              set --
              for f in $fx; do
                if ${pkgs.file}/bin/file --brief --mime-type "$f" | grep -q "^audio/"; then
                  set -- "$@" "$f"
                fi
              done

              if [ $# -gt 0 ]; then
                ${editId3Tags}/bin/edit-id3-tags "$@"
              fi

              lf -remote "send reload"
            }}
          '';

          # Preview audio files with `play`
          play = ''
            %{{
              (pkill -9 "play" 2>/dev/null || true) &
              if [[ "$( ${pkgs.file}/bin/file -Lb --mime-type "$f")" =~ ^audio ]]; then
                ${pkgs.sox}/bin/play "$f" </dev/null >/dev/null 2>&1 & disown
              fi
            }}
          '';

          # Kill audio preview
          playkill = ''
            %{{
              (pkill -9 "play" 2>/dev/null || true) &
            }}
          '';

          # Override lf's default file opening behavior
          open = ''
            ''${{
              case "$f" in
                # text files: open in editor
                *.txt|*.md|*.nix|*.json|*.yaml|*.yml|*.log|*.c|*.cpp|*.py|*.sh)
                  $EDITOR "$f"
                  ;;

                # pdf: open in zathura
                *.pdf)
                  ${pkgs.zathura}/bin/zathura "$f"
                  ;;

                # audio files: do nothing (prevent opening)
                *.mp3|*.flac|*.wav|*.ogg|*.m4a)
                  ;;

                # everything else: use xdg-open (NixOS-safe)
                *)
                  xdg-open "$f" >/dev/null 2>&1 &
                  ;;
              esac
            }}
          '';
        };

        # Image previewing
        extraConfig =
          let
            previewer = pkgs.writeShellScriptBin "pv.sh" ''
              file=$1
              w=$2
              h=$3
              x=$4
              y=$5

              # TODO: pdf, video
              if [[ "$( ${pkgs.file}/bin/file -Lb --mime-type "$file")" =~ ^image ]]; then
                # images: native kitty img rendering
                ${pkgs.kitty}/bin/kitty +kitten icat --silent --stdin no --transfer-mode memory --place "''${w}x''${h}@''${x}x''${y}" "$file" < /dev/null > /dev/tty
                exit 1
              elif [[ "$( ${pkgs.file}/bin/file -Lb --mime-type "$file")" =~ ^audio ]]; then
                # audio: preview metadata
                ${previewId3Tags}/bin/preview-id3-tags "$file"
                exit 1
              fi

              ${pkgs.pistol}/bin/pistol "$file"
            '';
            cleaner = pkgs.writeShellScriptBin "clean.sh" ''
              ${pkgs.kitty}/bin/kitty +kitten icat --clear --stdin no --silent --transfer-mode memory < /dev/null > /dev/tty
            '';
          in
          ''
            set cleaner ${cleaner}/bin/clean.sh
            set previewer ${previewer}/bin/pv.sh
          '';
      };
    };
}
