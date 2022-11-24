# Demark Language Specification

Demark is an extensible and unopinionated markup language for textual content, such as blog posts and other articles. Textual content is demarcated by curly brackets and tagged with an identifier. Identifiers in Demark are not predefined and have no semantic meaning. Hence, you can create any identifier to tag textual content; and since the identifier has no semantic meaning, the consumer can interpret it however it wants.

## File Extension and Encoding

Demark files are UTF-8 encoded plain text files with the extension `.dm`. We intentionally don't support the UTF-16 and UTF-32 encodings. For more information, please read the [UTF-8 Everywhere Manifesto](https://utf8everywhere.org/).

## Source Text

Demark source text is a sequence of UTF-8 bytes. All well-formed UTF-8 byte sequences, as defined in [Table 3-7 of The Unicode Standard Version 15.0 – Core Specification](https://www.unicode.org/versions/Unicode15.0.0/ch03.pdf), may occur in Demark source text where permitted by the Demark grammar. The table is reproduced here for ease of reference.

| Code Points       | First Byte | Second Byte | Third Byte | Fourth Byte |
| ----------------- | ---------- | ----------- | ---------- | ----------- |
| U+0000…U+007F     | 00…7F      |             |            |             |
| U+0080…U+07FF     | C2…DF      | 80…BF       |            |             |
| U+0800…U+0FFF     | E0         | A0…BF       | 80…BF      |             |
| U+1000…U+CFFF     | E1…EC      | 80…BF       | 80…BF      |             |
| U+D000…U+D7FF     | ED         | 80…9F       | 80…BF      |             |
| U+E000…U+FFFF     | EE…EF      | 80…BF       | 80…BF      |             |
| U+10000…U+3FFFF   | F0         | 90…BF       | 80…BF      | 80…BF       |
| U+40000…U+FFFFF   | F1…F3      | 80…BF       | 80…BF      | 80…BF       |
| U+100000…U+10FFFF | F4         | 80…8F       | 80…BF      | 80…BF       |

## Syntax and Grammar

The Demark syntax is defined by a context-free grammar whose terminal symbols are UTF-8 bytes. The set of all well-formed UTF-8 byte sequences is called a SourceCharacter, and every other non-terminal symbol is described in terms of SourceCharacter.

<dl>
  <dt><strong>SourceCharacter</strong>&ensp;=</dt>
  <dd><em>any well-formed UTF-8 byte sequence</em></dd>
  <dt><strong>WhiteSpaceCharacter</strong>&ensp;=</dt>
  <dd>|&ensp;<em>any SourceCharacter denoting a Unicode character with property White_Space=True</em></dd>
  <dd>|&ensp;<em>the SourceCharacter denoting the Unicode character U+200E &lt;Left-to-Right Mark&gt;</em></dd>
  <dd>|&ensp;<em>the SourceCharacter denoting the Unicode character U+200F &lt;Right-to-Left Mark&gt;</em></dd>
</dl>

For simplicity, we will henceforth omit SourceCharacter from the descriptions of other non-terminal symbols. When we describe a non-terminal symbol in terms of a Unicode character, it's implied that we mean the SourceCharacter denoting the Unicode character.

<dl>
  <dt><strong>SourceCharacter</strong>&ensp;=</dt>
  <dd><em>any well-formed UTF-8 byte sequence</em></dd>
  <dt><strong>WhiteSpaceCharacter</strong>&ensp;=</dt>
  <dd>|&ensp;<em>any Unicode character with property White_Space=True</em></dd>
  <dd>|&ensp;<em>U+200E &lt;Left-to-Right Mark&gt;</em></dd>
  <dd>|&ensp;<em>U+200F &lt;Right-to-Left Mark&gt;</em></dd>
  <dt><strong>WhiteSpace</strong>&ensp;=</dt>
  <dd><strong>WhiteSpaceCharacter</strong>*</dd>
  <dt><strong>SyntaxCharacter</strong>&ensp;=</dt>
  <dd>|&ensp;<em>U+0023 &lt;Number Sign&gt;</em></dd>
  <dd>|&ensp;<em>U+005C &lt;Reverse Solidus&gt;</em></dd>
  <dd>|&ensp;<em>U+007B &lt;Left Curly Bracket&gt;</em></dd>
  <dd>|&ensp;<em>U+007D &lt;Right Curly Bracket&gt;</em></dd>
  <dd>|&ensp;<em>U+007E &lt;Tilde&gt;</em></dd>
  <dt><strong>ContentCharacter</strong>&ensp;=</dt>
  <dd><strong>SourceCharacter</strong>&ensp;-&ensp;<strong>SyntaxCharacter</strong></dd>
  <dt><strong>ContentEscape</strong>&ensp;=</dt>
  <dd><em>U+005C &lt;Reverse Solidus&gt;</em>&ensp;<strong>SyntaxCharacter</strong></dd>
  <dt><strong>ContentString</strong>&ensp;=</dt>
  <dd>(<strong>ContentCharacter</strong>&ensp;|&ensp;<strong>ContentEscape</strong>)*</dd>
  <dt><strong>OtherCharacter</strong>&ensp;=</dt>
  <dd>|&ensp;<em>any Unicode character with property General_Category=Control</em></dd>
  <dd>|&ensp;<em>any Unicode character with property General_Category=Private_Use</em></dd>
  <dd>|&ensp;<em>any Unicode character with property General_Category=Unassigned</em></dd>
  <dt><strong>IdentifierCharacter</strong>&ensp;=</dt>
  <dd><strong>ContentCharacter</strong>&ensp;-&ensp;<strong>WhiteSpaceCharacter</strong>&ensp;-&ensp;<strong>OtherCharacter</strong></dd>
  <dt><strong>Identifier</strong>&ensp;=</dt>
  <dd><strong>IdentifierCharacter</strong>+</dd>
</dl>

Identifiers are case sensitive. Identifiers must always be compared for canonical equivalence. Hence, parsers should normalize identifiers to NFC, i.e. Normalization Form C.

<dl>
  <dt><strong>Document</strong>&ensp;=</dt>
  <dd><strong>WhiteSpace</strong>&ensp;<strong>TaggedContentGroup</strong>&ensp;<strong>WhiteSpace</strong></dd>
  <dt><strong>TaggedContentGroup</strong>&ensp;=</dt>
  <dd><em>U+005C &lt;Reverse Solidus&gt;</em>&ensp;<strong>TaggedContent</strong>&ensp;(<strong>WhiteSpace</strong>&ensp;<em>U+007E &lt;Tilde&gt;</em>&ensp;<strong>TaggedContent</strong>)*</dd>
  <dt><strong>TaggedContent</strong>&ensp;=</dt>
  <dd><strong>Identifier</strong>&ensp;<strong>WhiteSpace</strong>&ensp;<strong>DemarcatedContent</strong><sub>n</sub></dd>
  <dt><strong>DemarcatedContent</strong><sub>0</sub>&ensp;=</dt>
  <dd><em>U+007B &lt;Left Curly Bracket&gt;</em>&ensp;<strong>NonVerbatimContent</strong>&ensp;<em>U+007D &lt;Right Curly Bracket&gt;</em></dd>
  <dt><strong>DemarcatedContent</strong><sub>n+1</sub>&ensp;=</dt>
  <dd><strong>VerbatimStart</strong><sub>n+1</sub>&ensp;<strong>VerbatimContent</strong><sub>n+1</sub>*&ensp;<strong>VerbatimEnd</strong><sub>n+1</sub></dd>
  <dt><strong>VerbatimStart</strong><sub>0</sub>&ensp;=</dt>
  <dd><em>U+007B &lt;Left Curly Bracket&gt;</em></dd>
  <dt><strong>VerbatimStart</strong><sub>n+1</sub>&ensp;=</dt>
  <dd><em>U+0023 &lt;Number Sign&gt;</em>&ensp;<strong>VerbatimStart</strong><sub>n</sub></dd>
  <dt><strong>VerbatimContent</strong><sub>0</sub>&ensp;=</dt>
  <dd>|&ensp;<strong>SourceCharacter</strong>&ensp;-&ensp;<em>U+0023 &lt;Number Sign&gt;</em>&ensp;-&ensp;<em>U+007D &lt;Right Curly Bracket&gt;</em></dd>
  <dd>|&ensp;<em>U+0023 &lt;Number Sign&gt;</em>&ensp;<strong>VerbatimContent</strong><sub>0</sub></dd>
  <dt><strong>VerbatimContent</strong><sub>n+1</sub>&ensp;=</dt>
  <dd>|&ensp;<strong>SourceCharacter</strong>&ensp;-&ensp;<em>U+0023 &lt;Number Sign&gt;</em></dd>
  <dd>|&ensp;<em>U+0023 &lt;Number Sign&gt;</em>&ensp;<strong>VerbatimContent</strong><sub>n</sub></dd>
  <dt><strong>VerbatimEnd</strong><sub>0</sub>&ensp;=</dt>
  <dd><em>U+007D &lt;Right Curly Bracket&gt;</em></dd>
  <dt><strong>VerbatimEnd</strong><sub>n+1</sub>&ensp;=</dt>
  <dd><em>U+0023 &lt;Number Sign&gt;</em>&ensp;<strong>VerbatimEnd</strong><sub>n</sub></dd>
  <dt><strong>NonVerbatimContent</strong>&ensp;=</dt>
  <dd>|&ensp;<strong>ContentGroup</strong></dd>
  <dd>|&ensp;<strong>ContentString</strong>&ensp;<strong>ContentGroup</strong>?</dd>
  <dt><strong>ContentGroup</strong>&ensp;=</dt>
  <dd><strong>TaggedContentGroup</strong>&ensp;<strong>NonVerbatimContent</strong>?</dd>
</dl>

Document is the start symbol of the context-free grammar.
