
# █▀▀ █▀█ █▄░█ ▀█▀ █▀
# █▀░ █▄█ █░▀█ ░█░ ▄█

{ pkgs, ... }: {
  fonts = {

    fontconfig = {
      antialias = true;
      hinting.enable = true;
    };

    packages = with pkgs; [
      # (nerdfonts.override { fonts = [ "DroidSansMono" "NerdFontsSymbolsOnly"]; })
    
      noto-fonts
      noto-fonts-color-emoji

      # Monospace
      monocraft
      mononoki

      # Bitmap
      cozette
      scientifica
    ];
  };
}
