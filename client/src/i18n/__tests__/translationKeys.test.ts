// @vitest-environment node
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

type TranslationLeaf = string | number | boolean | null | unknown[];
type TranslationMap = Record<string, TranslationLeaf>;

function flattenTranslations(value: unknown, prefix = "", output: TranslationMap = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    output[prefix] = value as TranslationLeaf;
    return output;
  }

  for (const [key, childValue] of Object.entries(value)) {
    const childKey = prefix ? `${prefix}.${key}` : key;
    flattenTranslations(childValue, childKey, output);
  }

  return output;
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function expectMatchingTranslationFiles(filesByLanguage: Record<string, string>) {
  const translationsByLanguage = Object.fromEntries(
    Object.entries(filesByLanguage).map(([language, filePath]) => [
      language,
      flattenTranslations(readJson(filePath)),
    ]),
  );

  const allKeys = new Set(
    Object.values(translationsByLanguage).flatMap((translations) => Object.keys(translations)),
  );

  for (const [language, translations] of Object.entries(translationsByLanguage)) {
    const missingKeys = [...allKeys].filter((key) => !(key in translations));
    const invalidValues = Object.entries(translations)
      .filter(([, value]) => typeof value !== "string" || !value.trim())
      .map(([key]) => key);

    expect(missingKeys, `${language} is missing translation keys`).toEqual([]);
    expect(invalidValues, `${language} has empty or non-text translation values`).toEqual([]);
  }
}

describe("translation keys", () => {
  it("keeps common locale keys complete across all supported languages", () => {
    const localesDir = path.join(process.cwd(), "client/src/i18n/locales");
    const filesByLanguage = Object.fromEntries(
      fs.readdirSync(localesDir)
        .filter((language) => fs.existsSync(path.join(localesDir, language, "common.json")))
        .map((language) => [language, path.join(localesDir, language, "common.json")]),
    );

    expectMatchingTranslationFiles(filesByLanguage);
  });

  it("keeps glossary keys complete across all supported languages", () => {
    const glossaryDir = path.join(process.cwd(), "client/src/i18n/glossary");
    const filesByLanguage = Object.fromEntries(
      fs.readdirSync(glossaryDir)
        .filter((fileName) => fileName.endsWith(".json"))
        .map((fileName) => [
          fileName.replace(/\.json$/, ""),
          path.join(glossaryDir, fileName),
        ]),
    );

    expectMatchingTranslationFiles(filesByLanguage);
  });
});
