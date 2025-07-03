import crypto from "crypto";

export const generateTrackingNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase(); // Base-36 timestamp
  const randomSegment = crypto.randomBytes(4).toString("hex").toUpperCase(); // Random hex
  return `${timestamp}${randomSegment}`; // Only alphanumeric, no hyphens
};

console.log(generateTrackingNumber());