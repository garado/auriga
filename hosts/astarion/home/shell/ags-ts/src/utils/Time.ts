/**
 * ▀█▀ █ █▀▄▀█ █▀▀
 * ░█░ █ █░▀░█ ██▄
 *
 * Utility functions for operations on timestamps.
 */

/**
 * @function epochToHHMM
 * @param epoch - Unix epoch timestamp (seconds since 1970)
 */
export const epochToHHMM = (
  epoch: number,
  trailingZero: boolean = false, // Trailing zero on HH?
): string => {
  const date = new Date(epoch);
  const hours24 = date.getHours();
  const minutes = date.getMinutes();

  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";

  let hoursStr;
  if (trailingZero) {
    hoursStr = hours12.toString().padStart(2, "0");
  } else {
    hoursStr = hours12.toString();
  }

  const minutesStr = minutes.toString().padStart(2, "0");

  return `${hoursStr}:${minutesStr} ${ampm}`;
};

/**
 * @function epochToHHMM
 * @param epoch - Unix epoch timestamp (seconds since 1970)
 */
export const epochToDuration = (
  epochSeconds: number,
): { hours: string; minutes: string } => {
  const hoursNum = Math.floor(epochSeconds / 3600);
  const minutesNum = Math.floor((epochSeconds % 3600) / 60);

  const hours = hoursNum > 0 ? `${hoursNum}h` : "0h";
  const minutes = minutesNum > 0 ? `${minutesNum}m` : "";

  return { hours, minutes };
};

/**
 * @function epochToRelativeTime
 * @param epoch - Unix epoch timestamp (seconds since 1970)
 */
export const epochToRelativeTime = (epoch: number): string => {
  const now = Date.now();
  const diff = epoch * 1000 - now;
  const absDiff = Math.abs(diff);
  const seconds = Math.floor(absDiff / 1000);

  if (seconds < 1) return "now";

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let result: string;
  if (seconds < 60) {
    result = `${seconds} second${seconds !== 1 ? "s" : ""}`;
  } else if (minutes < 60) {
    result = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else if (hours < 24) {
    result = `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    result = `${days} day${days !== 1 ? "s" : ""}`;
  }

  return diff >= 0 ? `in ${result}` : `${result} ago`;
};
