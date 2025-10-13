<div align="center">
  <h1>Auriga</h1>
  <img src="dashboard-home.png" />
  <br>
  Another desktop with an emphasis on functionality and cohesive design. Made
  with Nix, <a href="https://aylur.github.io/ags/" target="_blank">ags</a>, and ❤️.
</div>

<h2>What is it?</h2>
<p>This repo contains my entire system configuration - all of my configs, my shell, etc. It is managed with NixOS.</p>
<p>The <b>desktop shell</b> (the UI for my system) is completely custom and deeply personalized. It is a creative outlet disguised as a set of productivity and utility widgets, and captures the best part of programming - making fun stuff!</p>
<p>Some highlights:</p>
<ul>
  <li><b>Finance tracker:</b> balance tracking, spending analysis, budget tracking, and visualizations for financial goals</li>
  <li><b>Paint color matcher:</b> AI-powered tool to analyze a color from a reference image and provide mixing instructions using the colors in my paint palettes</li>
  <li><b>Calendar:</b> synced with Google Calendar</li>
  <li><b>Personal goals tracker:</b> sortable, filterable, searchable </li>
  <li><b>Metronome:</b> for random quick guitar sessions</li>
  <li><b>AI prompt interface:</b> provides quick access to Gemini</li>
</ul>
<p>The shell is the successor to my <a href="https://github.com/garado/cozy" target="_blank">previous one</a>.</p>

<h2>Dashboard</h2>

<h3>Ledger</h3>
<div align="center">
<!-- TODO: Screenshots! -->
</div>
<p>A frontend for <a href="https://hledger.org/">hledger</a>, a plaintext accounting tool which I use to manage all of my finances.</p>
<p>The statistics tab displays balance tracking, debts/liabilities, recent spending analysis, and preview of recent transactions.</p>
<p>The analytics tab displays more detailed financial reports, such as spending by category by month.</p>
<p>The FIRE tab has an interactive plot showing current progress towards financial independence targets.</p>

<h3>Calendar</h3>
<p>Week view calendar with Google Calendar synchronization.</p>
<div align="center">
  <img src="dashboard-calendar.png" />
</div>

<h3>Goals tracking</h3>
<p>Sort, filter, and search goals tracked in TaskWarrior.</p>
<div align="center">
  <img src="dashboard-goals.png" />
</div>

<h3>Task tracking</h3>
<p>View tasks stored in Taskwarrior.</p>
<div align="center">
  <img src="dashboard-tasks.png" />
</div>
</div>

<h3>Trip planning</h3>
<p>A trip planning widget with multi-modal routing, route visualizations, and the option to send the trip details to my phone.</p>
<p>
  Made because I use the <a href="https://transitapp.com/" target="_blank">Transit app</a> a lot, and after finding out they had an API, I wanted to play around with it. The widget uses: libshumate (map rendering), LocationIQ (location autocomplete), Pushover (sending trip details to phone), and of course the wonderful Transit API.
</p>
<div align="center">
  <img src="dashboard-transit.gif" />
</div>

<h2>Control panel</h2>
<h3>Lots of convenient system controls</h3>
<p>UI scaler (for different DPI monitors), power settings, wifi/Bluetooth/audio control, monitor arrangement and settings, and a few more things.</p>
<div align="center">
  <img src="control.gif" />
</div>

<h3>Theme switcher</h3>
<p>Hot reloadable theme with shell, terminal, and wallpaper theme switching support.</p>
<div align="center">
  <img src="theme-reload.gif" height="800" />
</div>
</h3>

<h2>Utility panel</h2>

<h3>Paint mixer</h3>
<p>
  I like to paint (watercolor/gouache). I use this to help me match a specific
  color from a reference image. It supports multiple palettes and caches results
  so they're available next time I want to paint.
</p>
<div align="center">
  <table>
    <tr>
      <td><img src="utils-colormix.gif"></td>
      <td><img src="utils-colormix-result.png"></td>
    </tr>
  </table>
</div>

<h3>Sticky notes</h3>
<p>Little notes-to-self.</p>
<div align="center">
  <img src="utils-sticky.png" height="800" />
</div>

<h3>Metronome</h3>
<p>I play guitar. I made this metronome for when I feel like noodling around.</p>
<div align="center">
  <img src="utils-metronome.png"/>
</div>

<h3>Gemini chat</h3>
<p>For quick prompts to Gemini.</p>
<div align="center">
  <img src="utils-gemini.gif"/>
</div>

<h2>Acknowledgements</h2>
<div>
  <p>(People I have stolen from)</p>
  <ul>
    <li><a href="https://github.com/end-4/dots-hyprland" target="_blank">end-4</a></li>
    <li><a href="https://github.com/kotontrion/dotfiles?tab=readme-ov-file" target="_blank">kotontrion</a></li>
    <li><a href="https://github.com/Misterio77/nix-starter-configs" target="_blank">misterio77 minimal nix starter config</a></li>
    <li><a href="https://github.com/fufexan/dotfiles" target="_blank">fufexan</a></li>
    <li><a href="https://github.com/leowercase/dotfiles" target="_blank">leowercase</a></li>
    <li><a href="https://github.com/budimanjojo/dotfiles" target="_blank">budimanjojo</a></li>
  </ul>
</div>

<h2>Disclaimer</h2>
<div>
<p>This config is designed specifically for me. Works on my machine, but for others, it's best used as an implementation reference. I can provide little to no support if you want to run this yourself.</p>
</div>
