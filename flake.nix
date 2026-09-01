{
  description = "AURIGA";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";
    nixpkgs-2505.url = "github:nixos/nixpkgs/nixos-25.05";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";

    sops-nix = {
      url = "github:Mic92/sops-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    light.url = "github:garado/light";

    swww.url = "github:LGFae/swww";

    home-manager = {
      url = "github:nix-community/home-manager/release-25.11";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nix4nvchad = {
      url = "github:nix-community/nix4nvchad";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Real-time audio
    musnix.url = "github:musnix/musnix";

    zen-browser = {
      url = "github:0xc000022070/zen-browser-flake";
      inputs = {
        nixpkgs.follows = "nixpkgs";
        home-manager.follows = "home-manager";
      };
    };
  };

  outputs = { 
    self,
    home-manager,
    nixpkgs,
    nixpkgs-2505,
    nixpkgs-unstable,
    light,
    ... 
  } @ inputs: {

    formatter.x86_64-linux = nixpkgs.legacyPackages.x86_64-linux.nixfmt-rfc-style;

    homeModules.common = import ./modules/home;

    # ----------------------------------------------------------------------
    # NIXOS CONFIGURATIONS
    # ----------------------------------------------------------------------

    nixosConfigurations = {
      # Framework 13 (daily driver)
      astarion = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        specialArgs = {inherit inputs nixpkgs-unstable light self;};

        modules = [
          ./hosts/astarion/nixos/configuration.nix
          inputs.musnix.nixosModules.musnix
          home-manager.nixosModules.home-manager

          ({ users.users.alexis.extraGroups = [ "plugdev" ]; })

          {
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = {
              inherit self inputs nixpkgs-unstable;
              pkgs-2505 = import nixpkgs-2505 { system = "x86_64-linux"; };
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
        specialArgs = { inherit inputs self nixpkgs-unstable; };
        modules = [
          ./hosts/gethsemane/nixos/configuration.nix

          home-manager.nixosModules.home-manager
          {
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = { inherit self inputs nixpkgs-unstable; };
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

        specialArgs = {inherit inputs self;};

        modules = [
          ./hosts/archaea/nixos/configuration.nix

          home-manager.nixosModules.home-manager

          {
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = {inherit self inputs nixpkgs-unstable;};
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
