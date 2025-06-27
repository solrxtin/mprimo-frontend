import crypto from "crypto";

export const generateTrackingNumber = () => {
  const timestamp = Date.now().toString(36); // Base-36 timestamp
  const randomSegment = crypto.randomBytes(4).toString("hex").toUpperCase(); // Random hex
  return `TRK-${timestamp}-${randomSegment}`;
};

console.log(generateTrackingNumber());