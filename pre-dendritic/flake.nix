{
  description = "AURIGA";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";

    sops-nix = {
      url = "github:Mic92/sops-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    light = {
      url = "github:garado/light";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    home-manager = {
      url = "github:nix-community/home-manager/release-25.11";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nix4nvchad = {
      url = "github:nix-community/nix4nvchad";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Real-time audio
    musnix = {
      url = "github:musnix/musnix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    zen-browser = {
      url = "github:0xc000022070/zen-browser-flake";
      inputs = {
        nixpkgs.follows = "nixpkgs";
        home-manager.follows = "home-manager";
      };
    };

    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      home-manager,
      nixpkgs,
      light,
      treefmt-nix,
      ...
    }@inputs:
    let
      treefmtEval = treefmt-nix.lib.evalModule nixpkgs.legacyPackages.x86_64-linux {
        projectRootFile = "flake.nix";
        programs.nixfmt.enable = true;
      };
    in
    {

      formatter.x86_64-linux = treefmtEval.config.build.wrapper;
      checks.x86_64-linux.formatting = treefmtEval.config.build.check self;

      homeModules.common = import ./modules/home;

      # ----------------------------------------------------------------------
      # NIXOS CONFIGURATIONS
      # ----------------------------------------------------------------------

      nixosConfigurations = {
        # Framework 13 (daily driver)
        astarion = nixpkgs.lib.nixosSystem {
          system = "x86_64-linux";

          specialArgs = {
            inherit
              inputs
              light
              self
              ;
          };

          modules = [
            ./hosts/astarion/nixos/configuration.nix
            inputs.musnix.nixosModules.musnix
            home-manager.nixosModules.home-manager

            ({ users.users.alexis.extraGroups = [ "plugdev" ]; })

            {
              home-manager.useUserPackages = true;
              home-manager.extraSpecialArgs = {
                inherit self inputs;
              };
              home-manager.backupFileExtension = "hm-backup";
              home-manager.users.alexis = {
                imports = [
                  self.homeModules.common
                  ./hosts/astarion/home/home.nix
                ];
              };
            }
          ];

        };

        # Lenovo Ideapad Flex 5 14" 2-in-1 (home server)
        gethsemane = nixpkgs.lib.nixosSystem {
          system = "x86_64-linux";
          specialArgs = { inherit inputs self; };
          modules = [
            ./hosts/gethsemane/nixos/configuration.nix

            home-manager.nixosModules.home-manager
            {
              home-manager.useUserPackages = true;
              home-manager.extraSpecialArgs = { inherit self inputs; };
              home-manager.users.vessel = {
                imports = [
                  self.homeModules.common
                  ./hosts/gethsemane/home/home.nix
                ];
              };
            }
          ];
        };

        # Surface Go 2
        archaea = nixpkgs.lib.nixosSystem {
          system = "x86_64-linux";

          specialArgs = { inherit inputs self; };

          modules = [
            ./hosts/archaea/nixos/configuration.nix

            home-manager.nixosModules.home-manager

            {
              home-manager.useUserPackages = true;
              home-manager.extraSpecialArgs = { inherit self inputs; };
              home-manager.backupFileExtension = "hm-backup";
              home-manager.users.alexis = {
                imports = [
                  self.homeModules.common
                  ./hosts/archaea/home/home.nix
                ];
              };
            }
          ];

        };
      };

      # ----------------------------------------------------------------------
      # HOMEMANAGER CONFIGURATIONS
      # ----------------------------------------------------------------------

      homeConfigurations = {
        "aurora" = home-manager.lib.homeManagerConfiguration {
          pkgs = nixpkgs.legacyPackages."x86_64-linux";

          extraSpecialArgs = {
            inherit inputs self;
          };

          modules = [
            self.homeModules.common
            {
              home = {
                username = "agarado";
                homeDirectory = "/home/agarado";
                stateVersion = "25.11";
              };
            }
          ];
        };
      };
    };
}
