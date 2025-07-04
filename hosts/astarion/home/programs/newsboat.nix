
# █▄░█ █▀▀ █░█░█ █▀ █▄▄ █▀█ ▄▀█ ▀█▀
# █░▀█ ██▄ ▀▄▀▄▀ ▄█ █▄█ █▄█ █▀█ ░█░

{...}: {
  programs.newsboat = {
    enable = true;

    urls = [
      {
        title = "TechCrunch";
        url = "https://techcrunch.com/feed/";
      }
      {
        title = "NYT Space";
        url = "https://rss.nytimes.com/services/xml/rss/nyt/Space.xml";
      }
    ];
  };
}
