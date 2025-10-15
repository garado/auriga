/**
 * █▄░█ █▀▀ ▀█▀ █░█░█ █▀█ █▀█ █▄▀
 * █░▀█ ██▄ ░█░ ▀▄▀▄▀ █▄█ █▀▄ █░█
 *
 * Service to interface with nmcli for managing WiFi connections.
 * More featureful replacement for Astal.Network.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { AstalIO } from "astal";
import { GObject, register, property } from "astal/gobject";
import { execAsync } from "astal/process";
import { interval } from "astal/time";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const SCAN_INTERVAL_MS = 10000;

/*****************************************************************************
 * Interfaces
 *****************************************************************************/

export interface AccessPoint {
  ssid: string;
  bssid: string;
  signal: number;
  security: string;
  inUse: boolean;
}

export interface WifiStatus {
  connected: boolean;
  ssid: string | null;
  signal: number;
}

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "NmcliService" })
export default class NmcliService extends GObject.Object {
  // Set up singleton ---------------------------------------------------------
  static instance: NmcliService;

  static get_default() {
    if (!this.instance) {
      this.instance = new NmcliService();
    }
    return this.instance;
  }

  // Properties ---------------------------------------------------------------
  @property(Object)
  declare accessPoints: AccessPoint[];

  @property(Object)
  declare status: WifiStatus;

  @property(Boolean)
  declare enabled: boolean;

  // Private variables --------------------------------------------------------
  #scanInterval: number | null = null;
  #scanTimer: AstalIO.Time | null = null;

  // Constructor --------------------------------------------------------------
  constructor() {
    super();

    this.accessPoints = [];
    this.status = { connected: false, ssid: null, signal: 0 };
    this.enabled = false;

    this.#init();
  }

  // Private functions --------------------------------------------------------
  #init() {
    this.#updateStatus();
    this.#updateAccessPoints();
  }

  /**
   * Get information on currently active network.
   */
  async #getCurrentConnection(): Promise<number> {
    try {
      const output = await execAsync(
        "nmcli -t -f IN-USE,SIGNAL device wifi list",
      );
      const current = output.split("\n").find((line) => line.startsWith("*"));

      if (current) {
        const signal = current.split(":")[1];
        return parseInt(signal) || 0;
      }
    } catch {}
    return 0;
  }

  /**
   * Get connection status.
   */
  async #updateStatus() {
    try {
      const cmd =
        "nmcli -t -f GENERAL.STATE,GENERAL.CONNECTION device show wlp1s0"; // @TODO cmd not portable
      const output = await execAsync(cmd);
      const lines = output.split("\n");

      const state = lines
        .find((l) => l.startsWith("GENERAL.STATE:"))
        ?.split(":")[1];

      const connection = lines
        .find((l) => l.startsWith("GENERAL.CONNECTION:"))
        ?.split(":")[1];

      this.enabled = state !== "20 (unavailable)";

      this.status = {
        connected: state === "100 (connected)",
        ssid: connection && connection !== "--" ? connection : null,
        signal: await this.#getCurrentConnection(),
      };
    } catch (err) {
      console.warn(`Failed to update WiFi status: ${err}`);
      this.enabled = false;
      this.status = { connected: false, ssid: null, signal: 0 };
    }
  }

  /**
   * Fetch list of detected access points.
   *
   * Example output: (in use AP is denoted by beginning asterisk)
   * ````
   *  :Bobby_13:12\:36\:AA\:10\:82\:AD:92:WPA2 WPA3
   * *:Chappie's House:40\:4C\:77\:7A\:4A\:E9:92:WPA2
   *  ::4E\:4C\:77\:7A\:4A\:E9:92:WPA2
   * ````
   */
  async #updateAccessPoints() {
    try {
      const cmd = "nmcli -t -f IN-USE,SSID,BSSID,SIGNAL,SECURITY device wifi";
      const output = await execAsync(cmd);

      const aps: AccessPoint[] = output
        .trim() // Remove beginning, end whitespace
        .split("\n")
        .filter((line) => line) // Remove empty strings
        .map((line) => {
          const [inUse, ssid, bssid, signal, security] = line.split(":");
          return {
            ssid,
            bssid,
            signal: parseInt(signal) || 0,
            security,
            inUse: inUse === "*",
          };
        })
        .filter((ap) => ap.ssid);

      // Deduplicate by SSID, keep strongest
      const unique = new Map<string, AccessPoint>();
      aps.forEach((ap) => {
        const existing = unique.get(ap.ssid);
        if (!existing || ap.signal > existing.signal) {
          unique.set(ap.ssid, ap);
        }
      });

      // Sort by strongest signal
      this.accessPoints = Array.from(unique.values()).sort(
        (a, b) => b.signal - a.signal,
      );
    } catch (err) {
      console.warn(`Failed to update access points: ${err}`);
      this.accessPoints = [];
    }
  }

  // Public functions ---------------------------------------------------------

  /**
   * Connect to a WiFi network.
   */
  async activate(ssid: string, password?: string): Promise<void> {
    try {
      const cmd = password
        ? `nmcli device wifi connect "${ssid}" password "${password}"`
        : `nmcli device wifi connect "${ssid}"`;

      await execAsync(cmd);
      await this.#updateStatus();
    } catch (err) {
      throw new Error(`Failed to connect to ${ssid}: ${err}`);
    }
  }

  /**
   * Disconnect from currently connect network.
   */
  async unactivate(): Promise<void> {
    try {
      await execAsync("nmcli device disconnect wlp1s0");
      await this.#updateStatus();
    } catch (err) {
      throw new Error(`Failed to disconnect: ${err}`);
    }
  }

  /**
   * Enable WiFi.
   */
  async enable(): Promise<void> {
    try {
      await execAsync("nmcli radio wifi on");
      this.enabled = true;
      await this.#updateStatus();
    } catch (err) {
      throw new Error(`Failed to enable WiFi: ${err}`);
    }
  }

  /**
   * Disable WiFi.
   */
  async disable(): Promise<void> {
    try {
      await execAsync("nmcli radio wifi off");
      this.enabled = false;
      await this.#updateStatus();
    } catch (err) {
      throw new Error(`Failed to disable WiFi: ${err}`);
    }
  }

  /**
   * Manually trigger nmcli scan.
   */
  async scan(): Promise<void> {
    try {
      await execAsync("nmcli device wifi rescan");
      // Wait a moment for scan to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await this.#updateAccessPoints();
    } catch (err) {
      console.warn(`Scan failed: ${err}`);
    }
  }

  /**
   * Start periodic scanning.
   */
  startScanning(): void {
    if (this.#scanInterval) return;

    this.#scanTimer = interval(SCAN_INTERVAL_MS, async () => {
      await this.#updateAccessPoints();
      await this.#updateStatus();
    });
  }

  /**
   * Stop periodic scanning
   */
  stopScanning(): void {
    if (this.#scanInterval) {
      this.#scanInterval = null;
      this.#scanTimer?.cancel();
      this.#scanTimer = null;
    }
  }
}
