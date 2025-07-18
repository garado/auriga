{
  description = "Alexis's NixOS configuration";

  # A flake.nix file is an attribute set with two attributes
  # called `inputs` and `outputs`.

  # The `inputs` attribute lists other flakes you would like to use.
  inputs = {

  nixpkgs.url = "github:nixos/nixpkgs/nixos-24.11";

    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";

    swww.url = "github:LGFae/swww";

    home-manager = {
      url = "github:nix-community/home-manager/release-24.11";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    hyprland.url = "github:hyprwm/Hyprland";

    hyprsplit = {
      url = "github:shezdy/hyprsplit";
      inputs.hyprland.follows = "hyprland";
    };

    hardware.url = "github:nixos/nixos-hardware";

    # Widgets
    ags.url = "github:Aylur/ags/v2.3.0";

    # Real-time audio
    musnix.url = "github:musnix/musnix";
  };

  # The `outputs` attribute is a function.
  # Nix will fetch all the inputs (flakes) above, load *their* flake.nix files, and
  # then call the `outputs` function below with the results from loading all the
  # flakes above.
  outputs = { 
    home-manager, 
    nixpkgs, 
    hyprsplit, 
    ... 
  } @ inputs: {

    nixosConfigurations = {

      # Framework 13
      astarion = nixpkgs.lib.nixosSystem {
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
