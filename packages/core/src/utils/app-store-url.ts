export class InvalidAppStoreUrlError extends Error {
  constructor(public readonly input: string) {
    super(
      `"${input}" is not a valid Apple App Store app URL. ` +
        `Expected something like https://apps.apple.com/us/app/name/id123456789`,
    );
    this.name = "InvalidAppStoreUrlError";
  }
}

export interface ParsedAppStoreUrl {
  appId: string;
  country: string;
  url: string;
}

const APP_ID_RE = /\/id(\d+)/i;
const COUNTRY_RE = /apps\.apple\.com\/([a-z]{2})\//i;

export function parseAppStoreUrl(input: string): ParsedAppStoreUrl {
  const trimmed = input.trim();

  let host: string;
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    throw new InvalidAppStoreUrlError(input);
  }

  if (!host.endsWith("apps.apple.com") && !host.endsWith("itunes.apple.com")) {
    throw new InvalidAppStoreUrlError(input);
  }

  const idMatch = trimmed.match(APP_ID_RE);
  if (!idMatch?.[1]) {
    throw new InvalidAppStoreUrlError(input);
  }
  const appId = idMatch[1];

  const countryMatch = trimmed.match(COUNTRY_RE);
  const country = (countryMatch?.[1] ?? "us").toLowerCase();

  return {
    appId,
    country,
    url: `https://apps.apple.com/${country}/app/id${appId}`,
  };
}

export function isAppStoreUrl(input: string): boolean {
  try {
    parseAppStoreUrl(input);
    return true;
  } catch {
    return false;
  }
}
