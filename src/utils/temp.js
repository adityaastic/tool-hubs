import { promises as fs } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

export const createTempDir = async () => {
  const dir = path.join(os.tmpdir(), `files-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

export const writeTempFile = async (dir, name, buffer) => {
  const p = path.join(dir, name);
  await fs.writeFile(p, buffer);
  return p;
};

export const readFileBuffer = async p => fs.readFile(p);

export const listFiles = async dir => {
  const files = await fs.readdir(dir);
  return files.map(f => path.join(dir, f));
};

export const removeDir = async dir => {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {}
};
