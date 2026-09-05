# █░░ ▄▀█ █▄▄ █▄█ █▀█ █ █▄░█ ▀█▀ █░█ █ █▄░█ █▀▀
# █▄▄ █▀█ █▄█ ░█░ █▀▄ █ █░▀█ ░█░ █▀█ █ █░▀█ ██▄

# Wrapper scripts for my custom labyrinthine desktop shell.
# (in its own repo/flake, built on demand rather than packaged anywhere)
# TODO once it's stable, set up and run from a flake

{
  flake.modules.homeManager.labyrinthine =
    { pkgs, ... }:
    {
      home.packages = [
        (pkgs.writeShellScriptBin "labyrinthine" ''
          cd "$HOME/Github/labyrinthine"

          # If binary already exists, enter devshell and run it. Otherwise, enter devshell, compile, then run
          if [[ -x "./build/labyrinthine" ]]; then
            exec nix develop --command ./build/labyrinthine
          else
            exec nix develop --command bash -c "cmake -B build && cmake --build build && ./build/labyrinthine"
          fi
        '')

        (pkgs.writeShellScriptBin "labyrinthine-ctl" ''
          cd "$HOME/Github/labyrinthine"

          if [[ -x "./build/labyrinthine-ctl" ]]; then
            exec ./build/labyrinthine-ctl "$@"
          else
            exec nix develop --command bash -c "cmake -B build && cmake --build build && ./build/labyrinthine-ctl $*"
          fi
        '')
      ];
    };
}
