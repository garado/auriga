# █▀▄ █▀▀ █▀▀ ▀█▀ █▀
# █▄▀ ██▄ ██▄ ░█░ ▄█

{
  flake.modules.homeManager.beets =
    {
      lib,
      pkgs,
      config,
      ...
    }:
    let
      cfg = config.beets;
    in
    {
      options.beets.libraryPath = lib.mkOption {
        type = lib.types.str;
        description = "Music library directory beets imports into and manages tags for.";
        example = "/mnt/vault/Music/Library";
      };

      config.home.packages = [ pkgs.beets ];

      config.home.file.".config/beets/config.yaml".text = ''
        directory: ${cfg.libraryPath}

        plugins: ftintitle fetchart

        import:
          move: no
          copy: no
          write: yes

        # move "feat. X" out of the artist tag and into the title
        ftintitle:
          format: feat. {0}
          drop: no
      '';
    };
}
