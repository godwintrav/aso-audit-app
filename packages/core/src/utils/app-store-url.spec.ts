import { describe, expect, it } from "vitest";
import {
  InvalidAppStoreUrlError,
  isAppStoreUrl,
  parseAppStoreUrl,
} from "./app-store-url";

describe("parseAppStoreUrl", () => {
  it("extracts the app id and country from a full URL", () => {
    const result = parseAppStoreUrl(
      "https://apps.apple.com/ng/app/digitpay/id6747904851",
    );
    expect(result.appId).toBe("6747904851");
    expect(result.country).toBe("ng");
    expect(result.url).toBe("https://apps.apple.com/ng/app/id6747904851");
  });

  it("defaults the country to 'us' when not present", () => {
    const result = parseAppStoreUrl("https://apps.apple.com/app/id123456789");
    expect(result.appId).toBe("123456789");
    expect(result.country).toBe("us");
  });

  it("tolerates query strings and fragments", () => {
    const result = parseAppStoreUrl(
      "https://apps.apple.com/us/app/foo/id999?mt=8#reviews",
    );
    expect(result.appId).toBe("999");
    expect(result.country).toBe("us");
  });

  it("throws for non-App-Store URLs", () => {
    expect(() => parseAppStoreUrl("https://example.com/app/id123")).toThrow(
      InvalidAppStoreUrlError,
    );
  });

  it("throws for URLs without an app id", () => {
    expect(() => parseAppStoreUrl("https://apps.apple.com/us/app/foo")).toThrow(
      InvalidAppStoreUrlError,
    );
  });

  it("throws for garbage input", () => {
    expect(() => parseAppStoreUrl("not a url")).toThrow(InvalidAppStoreUrlError);
  });
});

describe("isAppStoreUrl", () => {
  it("returns true/false without throwing", () => {
    expect(isAppStoreUrl("https://apps.apple.com/us/app/x/id1")).toBe(true);
    expect(isAppStoreUrl("nope")).toBe(false);
  });
});
