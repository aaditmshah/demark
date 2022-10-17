# Demark

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/aaditmshah/demark/Continuous%20Deployment?logo=github)](https://github.com/aaditmshah/demark/actions/workflows/continuous-deployment.yml)
[![GitHub license](https://img.shields.io/github/license/aaditmshah/demark)](https://github.com/aaditmshah/demark/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@demark/parser?logo=npm)](https://www.npmjs.com/package/@demark/parser)
[![semantic-release: gitmoji](https://img.shields.io/badge/semantic--release-gitmoji-E10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Twitter](https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2Faaditmshah%2Fdemark)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Faaditmshah%2Fdemark)

The official [Demark language specification](https://github.com/aaditmshah/demark/blob/main/specification.md) and parser.

## What is Demark?

Demark is a new markup language for textual content, such as blog posts and other articles. It's a lightweight alternative to Markdown and XML. Demark was created to address the shortcomings of Markdown and XML.

1. **Markdown is not extensible.** Markdown cannot markup all the content that you want. To work around this limitation, you have to extend markdown in non-standard ways. For example, markdown doesn't support frontmatter. Hence, you have embed YAML in markdown documents to create the frontmatter. This is a big disadvantage of markdown over other markup languages like XML, which are extensible.
2. **Markdown is opinionated.** Markdown does more than just markup content. It also imposes its own semantics onto that content. For example, headings in markdown are converted into `<h1>` to `<h6>` tags, links are converted into `<a href>` tags, and paragraphs are converted into `<p>` tags. Furthermore, this semantics is enforced by the ecosystem of markdown tools. This makes it very difficult for people to use the contents of the markdown file the way they want to. Hence, you often have to use complex extensions to do things like generate a table of contents or generate a summary of a markdown document.
3. **XML is verbose.** No big surprise here. XML documents have a very low signal-to-noise ratio. This makes it a pain to read and write XML documents. This is also one of the reasons why markdown is so popular. Markdown has a very high signal-to-noise ratio. It's very easy to read and write markdown files.
4. **XML attributes cannot be complex.** XML tags must have simple string attributes. You can't have other XML tags as attributes. This means that complex attributes need to be modeled as child nodes. This is not ideal because we would like to separate metadata from content as much as possible.

Unlike markdown, Demark is extensible and unopinionated. Unlike XML, Demark is not verbose and Demark tags can be arbitrarily complex.

## How to write Demark files?

Demark files are UTF-8 encoded plain text files with the extension `.dm`. Here's an example Demark file.

```
\article{Blog Post Title}~tag{Category 1}~tag{Category 2}~tag{Category 3}~content{
  \paragraph{Lorem ipsum dolor sit amet, consectetur adipiscing elit.}
}
```

Demark files can contain any Unicode text, except for a few special characters, i.e. `#`, `\`, `{`, `}`, and `~`, which need to be escaped. For example, you can escape `#` using a reverse solidus, i.e. `\#`.

Text in Demark can be demarcated using curly brackets, i.e. `{` and `}`, and tagged with an identifier. For example, in the text `Mary had a \emphasis{little} lamb`, we demarcated `little` and tagged it using the identifier `emphasis`. Identifiers need to be prefixed with a reverse solidus, i.e. `\`, and can contain any Unicode display character except the aforementioned special characters.

Identifiers in Demark are not predefined and have no semantic meaning. This means that you can create any identifier you want, and interpret the identifiers in any way you want. Thus, Demark is extensible and unopinionated. You have 100% control over the content of your Demark files.

Related demarcated and tagged textual contents can be grouped. The first tag identifier in a group must be prefixed with a reverse solidus, i.e. `\`, and subsequent tag identifiers in the group must be prefixed with a tilde, i.e. `~`. For example, the text `\link{Demark}~href{https://www.npmjs.com/package/demark}` represents a hyperlink. It can be parsed into a object with `link` and `href` properties. Tag identifiers can be repeated in the same group, as shown in the example above.

Demark documents must have a single top-level tagged content group which contains all the textual content of the document. Only whitespace is allowed outside this top-level tagged content group.

Sometimes, you may wish to embed code in Demark files. However, you may not want to explicitly escape all the special characters in the code. Demark allows you to write verbatim text for such cases. All you need to do is prefix the curly brackets, i.e. `{` and `}`, with any number of hashes.

```
\code{javascript}~content#{
  const ack = (m, n) => {
    if (m === 0) return n + 1;
    if (n === 0) return ack(m - 1, 1);
    return ack(m - 1, ack(m, n - 1));
  };
#}
```

In the above example, we prefixed the curly brackets with a single hash, i.e. `#{` and `#}`. Anything between these two sequences is treated as verbatim content and doesn't need to be escaped. It's similar to `CDATA`, i.e. character data, in XML.

However, unlike character data in XML we can have nested Demark content with nested verbatim texts.

```
\code{demark}~content##{
  \code{javascript}~content#{
    const ack = (m, n) => {
      if (m === 0) return n + 1;
      if (n === 0) return ack(m - 1, 1);
      return ack(m - 1, ack(m, n - 1));
    };
  #}
##}
```

In the above example, everything between `##{` and `##}` is treated as verbatim text even though the verbatim text contains Demark content with verbatim text of its own.

## How to use Demark files?

Once you write a Demark document, you can parse it into an abstract syntax tree using a Demark parser.

This package contains the official Demark parser. You can install it as follows.

```
npm i @demark/parser
```

Or if you're using Yarn.

```
yarn add @demark/parser
```

Once you've installed Demark, you can read your Demark file and parse it as follows.

```typescript
import { readFile } from "node:fs/promises";
import { parse } from "@demark/parser";

const main = async () => {
  const bytes = await readFile("./example.dm");
  const result = parse(bytes);
  // do something with result
};

main().catch((error) => {
  console.error(error);
});
```

The result is a non-empty array of `TaggedContent` objects representing the top-level tagged content group. Each `TaggedContent` object contains `tag` and `content` properties. The `tag` is just a string. The content is an array of strings or nested `TaggedContentGroup` arrays. For example, here's what the result may look like.

```javascript
[
  {
    tag: "article",
    content: ["Blog Post Title"]
  },
  {
    tag: "tag",
    content: ["Category 1"]
  },
  {
    tag: "tag",
    content: ["Category 2"]
  },
  {
    tag: "tag",
    content: ["Category 3"]
  },
  {
    tag: "content",
    content: [
      "\n  ",
      [
        {
          tag: "paragraph",
          content: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."]
        }
      ],
      "\n"
    ]
  }
];
```

You may wish to convert the result into a more friendly data structure.
