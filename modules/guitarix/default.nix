# █▀▀ █░█ █ ▀█▀ ▄▀█ █▀█ █ ▀▄▀
# █▄█ █▄█ █ ░█░ █▀█ █▀▄ █ █░█

# Realtime audio setup for guitarix / JACK

{ inputs, ... }:
{
  flake.modules.nixos.guitarix =
    { pkgs, ... }:
    {
      imports = [ inputs.musnix.nixosModules.musnix ];

      musnix.enable = true;

      # MIDI sequencer + raw MIDI device access, for JACK/guitarix routing
      boot.kernelModules = [
        "snd-seq"
        "snd-rawmidi"
      ];

      environment.systemPackages = with pkgs; [
        guitarix
        qjackctl
        libjack2
        jack2
        jack_capture
      ];
    };
}
