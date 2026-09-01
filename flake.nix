
# ▄▀█ █░█ █▀█ █ █▀▀ ▄▀█
# █▀█ █▄█ █▀▄ █ █▄█ █▀█

{
  description = "Auriga";

  inputs = {
    nixpkgs.url      = "github:nixos/nixpkgs/nixos-25.11";
    flake-parts.url  = "github:hercules-ci/flake-parts";
    import-tree.url  = "github:vic/import-tree";
    
    home-manager = { url = "github:nix-community/home-manager/release-25.11"; inputs.nixpkgs.follows = "nixpkgs"; };
    light        = { url = "github:garado/light";                inputs.nixpkgs.follows = "nixpkgs"; };
    musnix       = { url = "github:musnix/musnix";               inputs.nixpkgs.follows = "nixpkgs"; };
    nix4nvchad   = { url = "github:nix-community/nix4nvchad";     inputs.nixpkgs.follows = "nixpkgs"; };
    sops-nix     = { url = "github:Mic92/sops-nix";              inputs.nixpkgs.follows = "nixpkgs"; };
    treefmt-nix  = { url = "github:numtide/treefmt-nix";         inputs.nixpkgs.follows = "nixpkgs"; };
  };

  outputs = inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } (inputs.import-tree ./modules);
}
