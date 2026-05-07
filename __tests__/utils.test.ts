import { cn, paginate, totalPages } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns an empty string when all args are falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("returns the correct slice for page 1", () => {
    expect(paginate(items, 1, 3)).toEqual([1, 2, 3]);
  });

  it("returns the correct slice for page 2", () => {
    expect(paginate(items, 2, 3)).toEqual([4, 5, 6]);
  });

  it("returns the remaining items on the last page", () => {
    expect(paginate(items, 4, 3)).toEqual([10]);
  });

  it("returns an empty array past the last page", () => {
    expect(paginate(items, 5, 3)).toEqual([]);
  });
});

describe("totalPages", () => {
  it("calculates pages with an even division", () => {
    expect(totalPages(12, 4)).toBe(3);
  });

  it("rounds up on uneven division", () => {
    expect(totalPages(10, 3)).toBe(4);
  });

  it("returns at least 1 even when there are no items", () => {
    expect(totalPages(0, 6)).toBe(1);
  });
});
