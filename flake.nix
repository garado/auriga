{
  description = "Alexis's NixOS configuration";

  # A flake.nix file is an attribute set with two attributes
  # called `inputs` and `outputs`.

  # The `inputs` attribute lists other flakes you would like to use.
  inputs = {
    nixCats.url = "github:BirdeeHub/nixCats-nvim";

    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";
    nixpkgs-2505.url = "github:nixos/nixpkgs/nixos-25.05";

    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";

    sops-nix = {
      url = "github:Mic92/sops-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    swww.url = "github:LGFae/swww";

    # waveforms.url = "github:liff/waveforms-flake?rev=c6fac3b8694ab95a3f4204b6bf110df9d2594d0f";

    home-manager = {
      url = "github:nix-community/home-manager/release-25.11";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nix4nvchad = {
      url = "github:nix-community/nix4nvchad";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    hyprland.url = "github:hyprwm/Hyprland";

    hardware.url = "github:nixos/nixos-hardware";

    # Widgets
    ags = {
      url = "github:Aylur/ags/v2.3.0";
      inputs.nixpkgs.follows = "nixpkgs-2505";  # ags v2 needs nixpkgs 25.05
    };

    # Real-time audio
    musnix.url = "github:musnix/musnix";
  };

  # The `outputs` attribute is a function.
  # Nix will fetch all the inputs (flakes) above, load *their* flake.nix files, and
  # then call the `outputs` function below with the results from loading all the
  # flakes above.
  outputs = { 
    self,
    home-manager,
    nixpkgs,
    nixpkgs-2505,
    nixpkgs-unstable,
    # waveforms,
    ... 
  } @ inputs: {

    nixosConfigurations = {

      # Framework 13
      astarion = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # Set all inputs parameters as special arguments for all submodules,
        # so you can directly use all dependencies in inputs in submodules
        specialArgs = {inherit inputs nixpkgs-unstable self;};

        modules = [
          ./hosts/astarion/nixos/configuration.nix

          # waveforms.nixosModule
          ({ users.users.alexis.extraGroups = [ "plugdev" ]; })

          inputs.musnix.nixosModules.musnix

          home-manager.nixosModules.home-manager

          {
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = {
              inherit self inputs nixpkgs-unstable;
              pkgs-2505 = import nixpkgs-2505 { system = "x86_64-linux"; };
            };
            home-manager.backupFileExtension = "hm-backup";
            home-manager.users.alexis = import ./hosts/astarion/home/home.nix;
          }
        ];

      };

      # Surface Go 2
      archaea = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # Set all inputs parameters as special arguments for all submodules,
        # so you can directly use all dependencies in inputs in submodules
        specialArgs = {inherit inputs;};

        modules = [
          ./hosts/astarion/nixos/configuration.nix

          inputs.musnix.nixosModules.musnix
        
          home-manager.nixosModules.home-manager

          {
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = {inherit inputs;};
            home-manager.users.alexis = import ./hosts/astarion/home/home.nix;
          }
        ];

      };

    };
  };
}
