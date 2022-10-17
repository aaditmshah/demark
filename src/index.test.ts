import { readFile } from "node:fs/promises";
import { parse } from ".";

describe("parse", () => {
  it("should correctly parse Demark documents", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/why-create-your-own-eslint-config.dm"
    );
    const result = parse(bytes);
    expect(result).toMatchSnapshot();
  });

  it("should correctly parse Demark documents with Unicode", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/nested-verbatim-unicode.dm");
    const result = parse(bytes);
    expect(result).toMatchSnapshot();
  });

  it("should throw an error on unexpected end of input", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/incomplete-document.dm");
    expect(() => parse(bytes)).toThrow(new Error("unexpected end of input"));
  });

  it("should throw an error for unexpected ascii character", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/unexpected-ascii-character.dm"
    );
    expect(() => parse(bytes)).toThrow(new Error("expected continuation byte"));
  });

  it("should throw an error for unexpected non-continuation byte", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/expected-continuation-byte.dm"
    );
    expect(() => parse(bytes)).toThrow(new Error("expected continuation byte"));
  });

  it("should throw an error for invalid continuation byte", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/invalid-continuation.dm");
    expect(() => parse(bytes)).toThrow(new Error("invalid byte"));
  });

  it("should throw an error for unexpected continuation byte", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/unexpected-continuation-byte.dm"
    );
    expect(() => parse(bytes)).toThrow(
      new Error("unexpected continuation byte")
    );
  });

  it("should throw an error for overlong 2 byte UTF-8 sequence", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/overlong-2-bytes.dm");
    expect(() => parse(bytes)).toThrow(new Error("overlong encoding"));
  });

  it("should throw an error for overlong 3 byte UTF-8 sequence", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/overlong-3-bytes.dm");
    expect(() => parse(bytes)).toThrow(new Error("overlong encoding"));
  });

  it("should throw an error for surrogate code points", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/surrogate-code-point.dm");
    expect(() => parse(bytes)).toThrow(new Error("surrogate character"));
  });

  it("should throw an error for overlong 4 byte UTF-8 sequence", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/overlong-4-bytes.dm");
    expect(() => parse(bytes)).toThrow(new Error("overlong encoding"));
  });

  it("should throw an error for invalid code points", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/invalid-code-point.dm");
    expect(() => parse(bytes)).toThrow(new Error("invalid code point"));
  });

  it("should throw an error for invalid byte", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/invalid-byte.dm");
    expect(() => parse(bytes)).toThrow(new Error("invalid byte"));
  });

  it("should throw an error for unexpected whitespace before identifier", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/unexpected-whitespace-before-identifier.dm"
    );
    expect(() => parse(bytes)).toThrow(
      new Error("unexpected whitespace character")
    );
  });

  it("should throw an error for unexpected syntax before identifier", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/unexpected-syntax-before-identifier.dm"
    );
    expect(() => parse(bytes)).toThrow(
      new Error("unexpected syntax character")
    );
  });

  it("should throw an error for unexpected character before identifier", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/unexpected-character-before-identifier.dm"
    );
    expect(() => parse(bytes)).toThrow(new Error("unexpected other character"));
  });

  it("should throw an error for invalid verbatim content start", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/invalid-verbatim-content-start.dm"
    );
    expect(() => parse(bytes)).toThrow(
      new Error("expected a left curly bracket")
    );
  });

  it("should throw an error for unescaped syntax character", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/unescaped-syntax-character.dm"
    );
    expect(() => parse(bytes)).toThrow(
      new Error("unexpected syntax character")
    );
  });

  it("should throw an error for invalid identifier", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/invalid/invalid-identifier.dm");
    expect(() => parse(bytes)).toThrow(
      new Error(
        "expected a whitespace character, a left curly bracket, or a number sign"
      )
    );
  });

  it("should throw an error for invalid character after identifier", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/invalid-character-after-identifier.dm"
    );
    expect(() => parse(bytes)).toThrow(
      new Error("expected a left curly bracket or a number sign")
    );
  });

  it("should throw an error for invalid document start", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/invalid-document-start.dm"
    );
    expect(() => parse(bytes)).toThrow(new Error("expected a reverse solidus"));
  });

  it("should throw an error for invalid document continue", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/invalid/invalid-document-continue.dm"
    );
    expect(() => parse(bytes)).toThrow(new Error("expected a tilde"));
  });
});
