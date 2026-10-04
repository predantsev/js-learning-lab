// Safe file work for the repository: names that cannot leave the data folder, bounded reads, atomic
// writes and the cleanup of temp files a crash left behind. Every FileHandle is closed in finally.
import { randomUUID } from "node:crypto";
import path from "node:path";
import { open, readdir, rename, rm, stat } from "node:fs/promises";

// The absolute path of `name` inside `baseDir`, or an Error when the resolved path leaves the folder
// ("../x", "/etc/hosts", "../data-backup/x") or is the folder itself. The resolved path decides, not
// the text of the name.
export function resolveInside(baseDir: string, name: string): string {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, name);
  const relative = path.relative(base, target);
  const outside = relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  if (outside) {
    throw new Error(`"${name}" is outside the data folder`);
  }
  return target;
}

// The text of a UTF-8 file of at most maxBytes, or null when the file does not exist yet. A bigger file
// is refused with a RangeError before a single byte is read; bytes that are not UTF-8 are an error, not
// a silent "�". Any other failure is reported with its cause.
export async function readTextBounded(file: string, maxBytes: number): Promise<string | null> {
  let size: number;
  try {
    ({ size } = await stat(file));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw new Error(`cannot read ${path.basename(file)}`, { cause: error });
  }
  if (size > maxBytes) {
    throw new RangeError(`${path.basename(file)} is ${size} bytes; the limit is ${maxBytes}`);
  }
  const handle = await open(file);
  try {
    const bytes = await handle.readFile();
    if (bytes.length > maxBytes) {
      throw new RangeError(`${path.basename(file)} grew past the limit of ${maxBytes} bytes`);
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    await handle.close();
  }
}

// Replaces `target` with `text` in one step: the text goes to a temp file with a unique name in the
// same folder, is flushed to the disk (sync) and only then renamed over the target. A crash before the
// rename leaves the old file whole and a *.tmp behind. `beforeRename` runs between the two — the place
// where a crash can be rehearsed.
export async function writeAtomic(target: string, text: string, beforeRename: () => void = () => {}): Promise<void> {
  const temp = `${target}.${randomUUID()}.tmp`;
  const handle = await open(temp, "w");
  try {
    await handle.writeFile(text, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  beforeRename();
  await rename(temp, target);
}

// Deletes the *.tmp files a crash left in `dir` (and nothing else); returns their names. A folder that
// does not exist yet has none.
export async function removeStaleTemps(dir: string): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const removed: string[] = [];
  for (const name of names) {
    if (name.endsWith(".tmp")) {
      await rm(path.join(dir, name), { force: true });
      removed.push(name);
    }
  }
  return removed;
}
