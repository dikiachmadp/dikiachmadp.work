import { describe, expect, it } from "vitest";
import {
  pageCount,
  pageQuery,
  pageWindow,
  parsePageParam,
} from "@/lib/pagination";

describe("parsePageParam", () => {
  it("keeps a valid page number", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("falls back to 1 when the param is missing", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam(null)).toBe(1);
    expect(parsePageParam("")).toBe(1);
  });

  // Semua ini berakhir di `skip` Prisma kalau lolos: `skip` negatif melempar,
  // dan pecahan menghasilkan offset yang tidak masuk akal.
  it("rejects values that would break the query", () => {
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("-5")).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("2.9")).toBe(2);
    expect(parsePageParam("Infinity")).toBe(1);
    expect(parsePageParam("NaN")).toBe(1);
  });

  // `?page=2&page=9` sampai ke server sebagai array.
  it("takes the first entry when the param repeats", () => {
    expect(parsePageParam(["2", "9"])).toBe(2);
    expect(parsePageParam([])).toBe(1);
  });
});

describe("pageCount", () => {
  it("counts partial pages", () => {
    expect(pageCount(25, 25)).toBe(1);
    expect(pageCount(26, 25)).toBe(2);
    expect(pageCount(51, 25)).toBe(3);
  });

  it("never drops below one page", () => {
    expect(pageCount(0, 25)).toBe(1);
    expect(pageCount(10, 0)).toBe(1);
  });
});

describe("pageQuery", () => {
  it("omits the query on the first page", () => {
    expect(pageQuery("1")).toBe("");
    expect(pageQuery(null)).toBe("");
  });

  it("carries the page onward", () => {
    expect(pageQuery("4")).toBe("?page=4");
  });

  // Field tersembunyi dikendalikan klien, jadi isinya tidak boleh menempel
  // mentah-mentah di URL redirect.
  it("normalises anything the client sends", () => {
    expect(pageQuery("4junk")).toBe("");
    expect(pageQuery("../../evil")).toBe("");
    expect(pageQuery("3.7")).toBe("?page=3");
  });
});

describe("pageWindow", () => {
  it("lists every page while the count is small", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps the first and last page reachable from the middle", () => {
    expect(pageWindow(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it("does not open a gap that spans a single page", () => {
    expect(pageWindow(2, 8)).toEqual([1, 2, 3, null, 8]);
    expect(pageWindow(7, 8)).toEqual([1, null, 6, 7, 8]);
  });

  it("never repeats the first or last page", () => {
    for (const current of [1, 2, 4, 19, 20]) {
      const window = pageWindow(current, 20);
      const numbers = window.filter((n): n is number => n !== null);
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });
});
