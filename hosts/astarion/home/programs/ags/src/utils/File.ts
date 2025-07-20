/**
 * █▀▀ █ █░░ █▀▀   █░█ ▀█▀ █ █░░ █▀
 * █▀░ █ █▄▄ ██▄   █▄█ ░█░ █ █▄▄ ▄█
 *
 * Utilities for file operations.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gio } from "astal";

/*****************************************************************************
 * Functions
 *****************************************************************************/

/**
 * Write to file, creating it and missing parents if necessary.
 * @param filePath - path of file to write
 * @param content - file contents
 */
export function fileWrite(filePath: string, content: string): void {
  try {
    // Create GFile object for the target file
    const file = Gio.File.new_for_path(filePath);

    // Get the parent directory
    const parentDir = file.get_parent();

    if (parentDir && !parentDir.query_exists(null)) {
      console.log(`Creating parent directories for: ${filePath}`);
      // Create all parent directories
      parentDir.make_directory_with_parents(null);
    }

    // Write the file content
    file.replace_contents(
      new TextEncoder().encode(content),
      null, // etag
      false, // make_backup
      Gio.FileCreateFlags.REPLACE_DESTINATION,
      null, // cancellable
    );

    console.log(`File created: ${filePath}`);
  } catch (error) {
    console.error("Error creating file:", error);
    throw error;
  }
}

export async function fileWriteAsync(
  filePath: string,
  content: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const file = Gio.File.new_for_path(filePath);
      const parentDir = file.get_parent();

      if (parentDir && !parentDir.query_exists(null)) {
        console.log(`Creating parent directories for: ${filePath}`);
        parentDir.make_directory_with_parents(null);
      }

      const bytes = new TextEncoder().encode(content);

      file.replace_contents_async(
        bytes,
        null, // etag
        false, // make_backup
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null, // cancellable
        (_sourceObject, result) => {
          try {
            file.replace_contents_finish(result);
            console.log(`File created: ${filePath}`);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Read file.
 * @param filePath - path of file to read
 */
export function readFile(filePath: string): string {
  try {
    const file = Gio.File.new_for_path(filePath);

    if (!file.query_exists(null)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const [success, contents] = file.load_contents(null);

    if (!success) {
      throw new Error(`Failed to read file: ${filePath}`);
    }

    return new TextDecoder().decode(contents);
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
}

/**
 * Read all files from a directory
 * @param dirPath - Directory to read from
 * @returns Record<string, string> content of files from directory
 */
export function readAllFilesFromDir(dirPath: string): {
  [filename: string]: string;
} {
  try {
    const dir = Gio.File.new_for_path(dirPath);

    if (!dir.query_exists(null)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    const fileInfo = dir.query_info(
      "standard::type",
      Gio.FileQueryInfoFlags.NONE,
      null,
    );
    if (fileInfo.get_file_type() !== Gio.FileType.DIRECTORY) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }

    const enumerator = dir.enumerate_children(
      "standard::name,standard::type",
      Gio.FileQueryInfoFlags.NONE,
      null,
    );
    const files: { [filename: string]: string } = {};

    let info;
    while ((info = enumerator.next_file(null)) !== null) {
      if (info.get_file_type() === Gio.FileType.REGULAR) {
        const filename = info.get_name();
        const childFile = dir.get_child(filename);

        try {
          const [success, contents] = childFile.load_contents(null);
          if (success) {
            files[filename] = new TextDecoder().decode(contents);
          }
        } catch (error) {
          console.warn(`Failed to read file ${filename}:`, error);
        }
      }
    }

    enumerator.close(null);
    return files;
  } catch (error) {
    console.error("Error reading directory:", error);
    throw error;
  }
}

/**
 * Read all files recursively from a directory
 * @param dirPath - The directory to read from
 */
export function readAllFilesRecursive(dirPath: string): {
  [filepath: string]: string;
} {
  const files: { [filepath: string]: string } = {};

  function readDirRecursive(
    currentDir: Gio.File,
    relativePath: string = "",
  ): void {
    try {
      const enumerator = currentDir.enumerate_children(
        "standard::name,standard::type",
        Gio.FileQueryInfoFlags.NONE,
        null,
      );

      let info;
      while ((info = enumerator.next_file(null)) !== null) {
        const name = info.get_name();
        const child = currentDir.get_child(name);
        const childPath = relativePath ? `${relativePath}/${name}` : name;

        if (info.get_file_type() === Gio.FileType.REGULAR) {
          // It's a file - read it
          try {
            const [success, contents] = child.load_contents(null);
            if (success) {
              files[childPath] = new TextDecoder().decode(contents);
            }
          } catch (error) {
            console.warn(`Failed to read file ${childPath}:`, error);
          }
        } else if (info.get_file_type() === Gio.FileType.DIRECTORY) {
          // It's a directory - recurse into it
          readDirRecursive(child, childPath);
        }
      }

      enumerator.close(null);
    } catch (error) {
      console.warn(`Failed to read directory ${relativePath}:`, error);
    }
  }

  try {
    const dir = Gio.File.new_for_path(dirPath);

    if (!dir.query_exists(null)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    readDirRecursive(dir);
    return files;
  } catch (error) {
    console.error("Error reading directory recursively:", error);
    throw error;
  }
}

/**
 * Delete a single file
 */
export function deleteFile(filePath: string): void {
  try {
    const file = Gio.File.new_for_path(filePath);

    if (!file.query_exists(null)) {
      console.warn(`File does not exist: ${filePath}`);
      return;
    }

    const fileInfo = file.query_info(
      "standard::type",
      Gio.FileQueryInfoFlags.NONE,
      null,
    );
    if (fileInfo.get_file_type() !== Gio.FileType.REGULAR) {
      throw new Error(`Path is not a regular file: ${filePath}`);
    }

    file.delete(null);
    console.log(`Deleted file: ${filePath}`);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

/**
 * Delete all files from a directory (keeps the directory and any subdirectories)
 */
export function deleteAllFilesFromDir(dirPath: string): void {
  try {
    const dir = Gio.File.new_for_path(dirPath);

    if (!dir.query_exists(null)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    const fileInfo = dir.query_info(
      "standard::type",
      Gio.FileQueryInfoFlags.NONE,
      null,
    );
    if (fileInfo.get_file_type() !== Gio.FileType.DIRECTORY) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }

    const enumerator = dir.enumerate_children(
      "standard::name,standard::type",
      Gio.FileQueryInfoFlags.NONE,
      null,
    );
    const deletedFiles: string[] = [];

    let info;
    while ((info = enumerator.next_file(null)) !== null) {
      if (info.get_file_type() === Gio.FileType.REGULAR) {
        const filename = info.get_name();
        const childFile = dir.get_child(filename);

        try {
          childFile.delete(null);
          deletedFiles.push(filename);
        } catch (error) {
          console.warn(`Failed to delete file ${filename}:`, error);
        }
      }
    }

    enumerator.close(null);
    console.log(`Deleted ${deletedFiles.length} files from ${dirPath}`);
  } catch (error) {
    console.error("Error deleting files from directory:", error);
    throw error;
  }
}
