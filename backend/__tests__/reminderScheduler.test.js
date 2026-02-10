const { parsePositiveInt } = require("../utils/reminderScheduler");

describe("parsePositiveInt", () => {
  test("returns parsed positive integer when valid", () => {
    expect(parsePositiveInt("42", 10)).toBe(42);
  });

  test("falls back when value is not a number", () => {
    expect(parsePositiveInt("abc", 10)).toBe(10);
  });

  test("falls back when value is negative", () => {
    expect(parsePositiveInt("-5", 10)).toBe(10);
  });

  test("falls back when value is zero", () => {
    expect(parsePositiveInt("0", 10)).toBe(10);
  });
});

