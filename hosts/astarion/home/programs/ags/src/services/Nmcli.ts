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

import { Gio } from "astal";
import { GObject, register, property } from "astal/gobject";
import { execAsync } from "astal/process";

/*****************************************************************************
 * Interfaces
 *****************************************************************************/

export interface AccessPoint {
  ssid: string;
  bssid: string;
  strength: number;
  security: string;
  inUse: boolean;
  known: boolean;
}

export interface WifiStatus {
  connected: boolean;
  ssid: string | null;
  strength: number;
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
  #knownConnections: Set<string> = new Set();

  /** dbus subscription references **/
  #subscriptionIds: number[] = [];

  // Constructor --------------------------------------------------------------
  constructor() {
    super();

    this.accessPoints = [];
    this.status = { connected: false, ssid: null, strength: 0 };
    this.enabled = false;

    this.#setupDbusConnections();
    this.#initData();
  }

  // Private functions --------------------------------------------------------

  /**
   * Subscribe to dbus signals for automatic UI updates
   */
  async #setupDbusConnections() {
    const bus = Gio.DBus.system;

    // Connection state changes
    const stateId = bus.signal_subscribe(
      "org.freedesktop.NetworkManager",
      "org.freedesktop.NetworkManager",
      "StateChanged",
      "/org/freedesktop/NetworkManager",
      null,
      Gio.DBusSignalFlags.NONE,
      () => {
        this.#updateStatus();
      },
    );

    // Property changes on wireless device (includes access points)
    const propsId = bus.signal_subscribe(
      "org.freedesktop.NetworkManager",
      "org.freedesktop.DBus.Properties",
      "PropertiesChanged",
      null, // Listen on all paths
      null,
      Gio.DBusSignalFlags.NONE,
      () => {
        this.#updateAccessPoints();
      },
    );

    this.#subscriptionIds.push(stateId, propsId);
  }

  async #initData() {
    await this.#updateKnownConnections();
    await this.#updateStatus();
    await this.#updateAccessPoints();
  }

  /**
   * Check if a network has a known connection profile.
   * Called from first `updateAccessPoints` call.
   *
   * The nmcli call includes networks that you've tried but never successfully
   * connected to - the filtering removes those by excluding `last connection
   * timestamp == 0` entries.
   */
  async #updateKnownConnections() {
    try {
      const output = await execAsync(
        "nmcli -t -f NAME,TIMESTAMP connection show",
      );
      this.#knownConnections = new Set(
        output
          .trim()
          .split("\n")
          .filter((line) => {
            const [_name, timestamp] = line.split(":");
            return timestamp !== "0";
          })
          .map((line) => line.split(":")[0]),
      );
    } catch (err) {
      console.warn(`nmcli: Failed to get known connections: ${err}`);
    }
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
        const strength = current.split(":")[1];
        return parseInt(strength) || 0;
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
        strength: await this.#getCurrentConnection(),
      };
    } catch (err) {
      console.warn(`Failed to update WiFi status: ${err}`);
      this.enabled = false;
      this.status = { connected: false, ssid: null, strength: 0 };
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
          const [inUse, ssid, bssid, strength, security] = line.split(":");
          return {
            ssid,
            bssid,
            strength: parseInt(strength) || 0,
            security,
            inUse: inUse === "*",
            known: this.#knownConnections.has(ssid),
          };
        })
        .filter((ap) => ap.ssid);

      // Deduplicate by SSID, keep strongest
      const unique = new Map<string, AccessPoint>();
      aps.forEach((ap) => {
        const existing = unique.get(ap.ssid);
        if (!existing || ap.strength > existing.strength) {
          unique.set(ap.ssid, ap);
        }
      });

      // Sort by strongest signal strength
      this.accessPoints = Array.from(unique.values()).sort(
        (a, b) => b.strength - a.strength,
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
      await this.#initData();
    } catch (err) {
      console.error(err);
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
      await this.#initData();
    } catch (err) {
      console.error(err);
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
}
