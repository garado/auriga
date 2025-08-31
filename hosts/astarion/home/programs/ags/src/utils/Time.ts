export const epochToHHMM = (epoch: number): string => {
  const date = new Date(epoch * 1000);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const epochToDuration = (
  epochSeconds: number,
): { hours: string; minutes: string } => {
  const hoursNum = Math.floor(epochSeconds / 3600);
  const minutesNum = Math.floor((epochSeconds % 3600) / 60);

  const hours = hoursNum > 0 ? `${hoursNum}h` : "0h";
  const minutes = minutesNum > 0 ? `${minutesNum}m` : "";

  return { hours, minutes };
};

export const epochToRelativeTime = (epoch: number): string => {
  // Normalize epoch (handle both seconds and milliseconds)
  if (epoch < 1e12) {
    epoch *= 1000;
  }

  const now = Date.now();
  const diff = epoch - now;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
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
