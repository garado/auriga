{
  description = "Auriga Desktop Environment Development Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:Aylur/ags/v2.3.0";
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
        name = "auriga";
        entry = "app.ts";
        gtk4 = true;

        # additional libraries and executables to add to gjs' runtime
        extraPackages = [
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
          pkgs.gtksourceview5
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
