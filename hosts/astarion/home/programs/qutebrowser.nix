
# █▀█ █░█ ▀█▀ █▀▀ █▄▄ █▀█ █▀█ █░█░█ █▀ █▀▀ █▀█
# ▀▀█ █▄█ ░█░ ██▄ █▄█ █▀▄ █▄█ ▀▄▀▄▀ ▄█ ██▄ █▀▄

{...}: {
  programs.qutebrowser = {
    enable = true;

    quickmarks = {
      gh = "https://github.com";
      yt = "https://youtube.com";
      ags = "https://aylur.github.io/ags-docs/";
      agsgh = "https://github.com/Aylur/ags";
      gjs = "https://gjs.guide/guides/";
      gtk = "https://docs.gtk.org/gtk3/";
      mail = "https://mail.google.com";
      gdev = "https://garado.dev/";
      quince = "https://www.quince.com/";
    };

    settings = {
      scrolling.smooth = true;
    };

    # Can't figure out how to set this correctly in settings{}
    extraConfig = ''
      c.fonts.default_size = '18pt'
      c.fonts.web.size.default = 20

      c.url.searchengines = {
        'DEFAULT': 'https://google.com/search?hl=en&q={}',
        'aw': 'https://wiki.archlinux.org/?search={}',
        'nw': 'https://nixos.wiki/index.php?search={}',
        'np': 'https://search.nixos.org/packages?channel=23.11&from=0&size=50&sort=relevance&type=packages&query={}',
        'hm': 'https://mipmip.github.io/home-manager-option-search/?query={}',
        're': 'https://reddit.com/search?q={}',
        'yt': 'https://youtube.com/results?search_query={}',
        'gh': 'https://github.com/search?o=desc&q={}&s=stars',
        'm':  'https://www.google.com/maps/search/{}',
        'w':  'https://en.wikipedia.org/wiki/{}',
        'th': 'https://www.thingiverse.com/search?q={}&page=1'
      }
    '';
      # TODO fix stupid flicker
      # c.colors.webpage.bg = 'black'
      # c.colors.webpage.darkmode.enabled = True
  };
}
