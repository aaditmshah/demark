// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Ambient Declaration File
/// <reference path="./unicode.d.ts" />
import WhiteSpaceCodePoints from "@unicode/unicode-15.0.0/Binary_Property/White_Space/code-points";
import ControlCodePoints from "@unicode/unicode-15.0.0/General_Category/Control/code-points";
import PrivateUseCodePoints from "@unicode/unicode-15.0.0/General_Category/Private_Use/code-points";
import UnassignedCodePoints from "@unicode/unicode-15.0.0/General_Category/Unassigned/code-points";

interface State {
  bytes: Uint8Array;
  index: number;
}

const NextByte = (state: State) => {
  const nextByte = state.bytes[state.index];
  if (typeof nextByte === "undefined")
    throw new Error("unexpected end of input");
  state.index += 1;
  return nextByte;
};

const ContinuationByte = (state: State) => {
  const continuationByte = NextByte(state);
  if (continuationByte < 0x80) throw new Error("expected continuation byte");
  if (continuationByte < 0xc0) return continuationByte - 0x80;
  if (continuationByte < 0xf5) throw new Error("expected continuation byte");
  throw new Error("invalid byte");
};

const SourceCharacter = (state: State) => {
  const firstByte = NextByte(state);
  if (firstByte < 0x80) return firstByte;
  if (firstByte < 0xc0) throw new Error("unexpected continuation byte");
  if (firstByte < 0xc2) throw new Error("overlong encoding");
  if (firstByte < 0xe0) {
    const bits0 = firstByte - 0xc0;
    const bits1 = ContinuationByte(state);
    return 0x40 * bits0 + bits1;
  }
  if (firstByte < 0xf0) {
    const bits0 = firstByte - 0xe0;
    const bits1 = ContinuationByte(state);
    if (bits0 === 0x0 && bits1 < 0x20) throw new Error("overlong encoding");
    if (bits0 === 0xd && bits1 >= 0x20) throw new Error("surrogate character");
    const bits2 = ContinuationByte(state);
    return 0x10_00 * bits0 + 0x40 * bits1 + bits2;
  }
  if (firstByte < 0xf5) {
    const bits0 = firstByte - 0xf0;
    const bits1 = ContinuationByte(state);
    if (bits0 === 0 && bits1 < 0x10) throw new Error("overlong encoding");
    if (bits0 === 4 && bits1 >= 0x10) throw new Error("invalid code point");
    const bits2 = ContinuationByte(state);
    const bits3 = ContinuationByte(state);
    return 0x4_00_00 * bits0 + 0x10_00 * bits1 + 0x40 * bits2 + bits3;
  }
  throw new Error("invalid byte");
};

const LeftToRightMarkCodePoint = "\u200E".codePointAt(0);
const RightToLeftMarkCodePoint = "\u200F".codePointAt(0);

const WhiteSpaceCharacterCodePoints = new Set([
  ...WhiteSpaceCodePoints,
  LeftToRightMarkCodePoint,
  RightToLeftMarkCodePoint
]);

const NumberSignCodePoint = "#".codePointAt(0);
const ReverseSolidusCodePoint = "\\".codePointAt(0);
const LeftCurlyBracketCodePoint = "{".codePointAt(0);
const RightCurlyBracketCodePoint = "}".codePointAt(0);
const TildeCodePoint = "~".codePointAt(0);

const SyntaxCharacterCodePoints = new Set([
  NumberSignCodePoint,
  ReverseSolidusCodePoint,
  LeftCurlyBracketCodePoint,
  RightCurlyBracketCodePoint,
  TildeCodePoint
]);

const OtherCharacterCodePoints = new Set([
  ...ControlCodePoints,
  ...PrivateUseCodePoints,
  ...UnassignedCodePoints
]);

type Stream<A> = [A, ...A[]];

type Data = string | TaggedContentGroup;

type Content = Data[];

interface TaggedContent {
  tag: string;
  content: Content;
}

type TaggedContentGroup = Stream<TaggedContent>;

const IdentifierCharacter = (codePoint: number) => {
  if (WhiteSpaceCharacterCodePoints.has(codePoint))
    throw new Error("unexpected whitespace character");
  if (SyntaxCharacterCodePoints.has(codePoint))
    throw new Error("unexpected syntax character");
  if (OtherCharacterCodePoints.has(codePoint))
    throw new Error("unexpected other character");
  return String.fromCodePoint(codePoint);
};

const VerbatimContentString = (state: State, level: number) => {
  let string = "";
  while (string.length < level) {
    const codePoint = SourceCharacter(state);
    string += String.fromCodePoint(codePoint);
    if (codePoint !== NumberSignCodePoint) return string;
  }
  const codePoint = SourceCharacter(state);
  string += String.fromCodePoint(codePoint);
  return codePoint === RightCurlyBracketCodePoint ? undefined : string;
};

const VerbatimContent = (state: State): Content => {
  let level = 1;
  let codePoint = SourceCharacter(state);
  while (codePoint !== LeftCurlyBracketCodePoint) {
    if (codePoint !== NumberSignCodePoint)
      throw new Error("expected a left curly bracket");
    level += 1;
    codePoint = SourceCharacter(state);
  }
  let data = "";
  let string = VerbatimContentString(state, level);
  while (typeof string !== "undefined") {
    data += string;
    string = VerbatimContentString(state, level);
  }
  return data === "" ? [] : [data];
};

const NonVerbatimData = (state: State, initialCodePoint: number): Data => {
  let codePoint = initialCodePoint;
  if (codePoint === ReverseSolidusCodePoint) {
    codePoint = SourceCharacter(state);
    return SyntaxCharacterCodePoints.has(codePoint)
      ? String.fromCodePoint(codePoint)
      : [TaggedContentParser(state, codePoint)];
  }
  if (SyntaxCharacterCodePoints.has(codePoint))
    throw new Error("unexpected syntax character");
  return String.fromCodePoint(codePoint);
};

const NonVerbatimContent = (state: State): Content => {
  const content: Content = [];
  let string = "";
  let group: TaggedContentGroup | false = false;
  let codePoint = SourceCharacter(state);
  while (codePoint !== RightCurlyBracketCodePoint) {
    if (group === false) {
      const data = NonVerbatimData(state, codePoint);
      if (typeof data === "string") string += data;
      else {
        if (string !== "") {
          content.push(string);
          string = "";
        }
        content.push(data);
        group = data;
      }
    } else if (WhiteSpaceCharacterCodePoints.has(codePoint)) {
      string += String.fromCodePoint(codePoint);
    } else if (codePoint === TildeCodePoint) {
      group.push(TaggedContentParser(state));
      string = "";
    } else {
      group = false;
      // eslint-disable-next-line no-continue -- intentional
      continue;
    }
    codePoint = SourceCharacter(state);
  }
  return string === "" ? content : [...content, string];
};

function TaggedContentParser(
  state: State,
  initialCodePoint = SourceCharacter(state)
): TaggedContent {
  let codePoint = initialCodePoint;
  let tag = IdentifierCharacter(codePoint);
  codePoint = SourceCharacter(state);
  while (
    !WhiteSpaceCharacterCodePoints.has(codePoint) &&
    codePoint !== LeftCurlyBracketCodePoint &&
    codePoint !== NumberSignCodePoint
  ) {
    if (
      SyntaxCharacterCodePoints.has(codePoint) ||
      OtherCharacterCodePoints.has(codePoint)
    ) {
      throw new Error(
        "expected a whitespace character, a left curly bracket, or a number sign"
      );
    }
    tag += String.fromCodePoint(codePoint);
    codePoint = SourceCharacter(state);
  }
  while (
    codePoint !== LeftCurlyBracketCodePoint &&
    codePoint !== NumberSignCodePoint
  ) {
    if (!WhiteSpaceCharacterCodePoints.has(codePoint))
      throw new Error("expected a left curly bracket or a number sign");
    codePoint = SourceCharacter(state);
  }
  const content =
    codePoint === LeftCurlyBracketCodePoint
      ? NonVerbatimContent(state)
      : VerbatimContent(state);
  return { tag: tag.normalize("NFC"), content };
}

const Document = (state: State) => {
  let codePoint = SourceCharacter(state);
  while (codePoint !== ReverseSolidusCodePoint) {
    if (!WhiteSpaceCharacterCodePoints.has(codePoint))
      throw new Error("expected a reverse solidus");
    codePoint = SourceCharacter(state);
  }
  const taggedContentGroup: TaggedContentGroup = [TaggedContentParser(state)];
  while (state.index < state.bytes.length) {
    codePoint = SourceCharacter(state);
    if (codePoint === TildeCodePoint)
      taggedContentGroup.push(TaggedContentParser(state));
    else if (!WhiteSpaceCharacterCodePoints.has(codePoint))
      throw new Error("expected a tilde");
  }
  return taggedContentGroup;
};

const parse = (bytes: Uint8Array) => Document({ bytes, index: 0 });

export { parse };
