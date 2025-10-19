/**
 * █▀ █▀▀ █▀▀ █▀█ █▀▀ ▀█▀ █▀
 * ▄█ ██▄ █▄▄ █▀▄ ██▄ ░█░ ▄█
 *
 * Auriga needs some secrets for fetching data from APIs.
 *
 * You can either store the secrets in plaintext in `userconfig.ts`, as the "key" field.
 * Or if you are using sops, you can tell auriga where to find the decrypted secret, as the "sopsPath" field.
 *
 * See src/services/settings/DefaultConfig.ts to see the user config structure.
 */

import { readFile } from "./File";

interface SecretStorage {
  key: string /** Store plaintext */;
  sopsPath: string /** Decrypted through sops */;
}

export const getSecret = (secretStore: SecretStorage) => {
  if (secretStore.sopsPath) {
    try {
      return readFile(secretStore.sopsPath);
    } catch (e) {
      console.error(`Failed to read sops secret: ${e}`);
    }
  }

  return secretStore.key || "";
};
