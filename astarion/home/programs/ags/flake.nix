{
  description = "Auriga Development Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ags,
  }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    packages.${system} = {
      default = ags.lib.bundle {
        inherit pkgs;
        src = ./.;
        name = "my-shell";
        entry = "app.ts";

        # additional libraries and executables to add to gjs' runtime
        extraPackages = [
          dart-sass

          ags.packages.${system}.battery
          ags.packages.${system}.apps
          ags.packages.${system}.auth
          ags.packages.${system}.battery
          ags.packages.${system}.bluetooth
          ags.packages.${system}.cava
          ags.packages.${system}.greet
          ags.packages.${system}.hyprland
          ags.packages.${system}.mpris
          ags.packages.${system}.network
          ags.packages.${system}.notifd
          ags.packages.${system}.powerProfiles
          ags.packages.${system}.wirePlumber
          pkgs.fzf
        ];
      };
    };

    devShells.${system} = {
      default = pkgs.mkShell {
        buildInputs = [
          # includes astal3 astal4 astal-io by default
          (ags.packages.${system}.default.override {
            extraPackages = [
              # cherry pick packages
            ];
          })
        ];
      };
    };
  };
}
