import crypto from "crypto";
import { readFile } from "fs/promises";

async function calculateHash(filePath: any): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const hash = crypto.createHash("sha1").update(fileBuffer).digest("hex");
    return hash;
}

export default calculateHash;