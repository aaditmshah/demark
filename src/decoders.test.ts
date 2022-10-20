import { readFile } from "node:fs/promises";
import { map, alt, some, many, decode, text, group, tagged } from "./decoders";
import type { Stream } from "./parser";
import { parse } from "./parser";

interface Code {
  tag: "code";
  value: string;
}

const createCode = (value: string): Code => ({ tag: "code", value });

const code = group(map(createCode, tagged("code", text)));

interface Link {
  tag: "link";
  value: string | Code;
  href: string;
}

const createLink = (value: string | Code, href: string): Link => ({
  tag: "link",
  value,
  href
});

const link = group(
  map(createLink, tagged("link", alt(text, code)), tagged("href", text))
);

interface Paragraph {
  tag: "paragraph";
  contents: Stream<string | Code | Link>;
}

const createParagraph = (
  contents: Stream<string | Code | Link>
): Paragraph => ({
  tag: "paragraph",
  contents
});

const paragraph = group(
  map(createParagraph, tagged("paragraph", some(alt(text, code, link))))
);

interface Section {
  tag: "section";
  title: string;
  paragraphs: Stream<Paragraph>;
}

const createSection = (
  title: string,
  paragraphs: Stream<Paragraph>
): Section => ({
  tag: "section",
  title,
  paragraphs
});

const section = group(
  map(
    createSection,
    tagged("section", text),
    tagged("content", some(paragraph))
  )
);

interface ArticleContent {
  paragraphs: Stream<Paragraph>;
  sections: Stream<Section>;
}

const createArticleContent = (
  paragraphs: Stream<Paragraph>,
  sections: Stream<Section>
): ArticleContent => ({
  paragraphs,
  sections
});

const articleContent = map(
  createArticleContent,
  some(paragraph),
  some(section)
);

interface Article {
  tag: "article";
  title: string;
  tags: Stream<string>;
  introduction: Stream<Paragraph>;
  body: Stream<Section>;
}

const createArticle = (
  title: string,
  tags: Stream<string>,
  { paragraphs, sections }: ArticleContent
): Article => ({
  tag: "article",
  title,
  tags,
  introduction: paragraphs,
  body: sections
});

const article = map(
  createArticle,
  tagged("article", text),
  some(tagged("tag", text)),
  tagged("content", articleContent)
);

interface CodeLang extends Code {
  language: string;
}

const createCodeLang = (language: string, value: string): CodeLang => ({
  tag: "code",
  language,
  value
});

const codeLang = group(
  map(createCodeLang, tagged("code", text), tagged("content", text))
);

interface Marker {
  tag: "marker";
  value: string;
}

const createMarker = (value: string): Marker => ({ tag: "marker", value });

const marker = group(map(createMarker, tagged("marker", text)));

interface SimpleArticle {
  tag: "article";
  title: string;
  content: (Marker | Code)[];
}

const createSimpleArticle = (
  title: string,
  content: (Marker | Code)[]
): SimpleArticle => ({ tag: "article", title, content });

const simpleArticle = map(
  createSimpleArticle,
  tagged("article", text),
  tagged("content", many(alt(marker, codeLang)))
);

const join2 = (a: string, b: string) => a + b;
const join3 = (a: string, b: string, c: string) => a + b + c;
const join4 = (a: string, b: string, c: string, d: string) => a + b + c + d;

const simpleMarker = group(tagged("marker", text));

const documentError = tagged(
  "foo",
  map(join3, simpleMarker, simpleMarker, text)
);

const documentErrors = alt(
  tagged("foo", map(join4, simpleMarker, simpleMarker, text, simpleMarker)),
  tagged("foo", map(join2, simpleMarker, text)),
  tagged("foo", map(join3, simpleMarker, simpleMarker, simpleMarker)),
  tagged("bar", map(join3, simpleMarker, simpleMarker, text)),
  tagged("foo", simpleMarker),
  tagged("foo", map(join2, simpleMarker, simpleMarker)),
  map(
    join2,
    tagged("foo", map(join3, simpleMarker, simpleMarker, text)),
    tagged("bar", simpleMarker)
  )
);

describe("decode", () => {
  it("should correctly decode parsed Demark documents", async () => {
    expect.assertions(1);
    const bytes = await readFile(
      "./examples/why-create-your-own-eslint-config.dm"
    );
    const result = decode(article, parse(bytes));
    expect(result).toMatchSnapshot();
  });

  it("should correctly decode parsed Demark documents with Unicode", async () => {
    expect.assertions(1);
    const bytes = await readFile("./examples/nested-verbatim-unicode.dm");
    const result = decode(simpleArticle, parse(bytes));
    expect(result).toMatchSnapshot();
  });

  it("should throw an error on decoding invalid Demark documents", async () => {
    expect.assertions(2);
    const bytes = await readFile("./examples/decoder-failure-actual.dm");
    const result = parse(bytes);
    expect(() => decode(documentError, result)).toThrow(
      new Error("all input not decoded")
    );
    expect(() => decode(documentErrors, result)).toThrow(
      new Error("all alternatives failed")
    );
  });
});
