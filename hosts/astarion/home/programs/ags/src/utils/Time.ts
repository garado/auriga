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
