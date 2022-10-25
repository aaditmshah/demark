import WhiteSpaceCodePoints from "@unicode/unicode-15.0.0/Binary_Property/White_Space/code-points";
import type { Stream, Data, TaggedContent } from "./parser";

const LeftToRightMarkCodePoint = 0x20_0e;
const RightToLeftMarkCodePoint = 0x20_0f;

const WhiteSpaceCharacterCodePoints = [
  ...WhiteSpaceCodePoints,
  LeftToRightMarkCodePoint,
  RightToLeftMarkCodePoint
];

const WhiteSpaceRegExp = new RegExp(
  `^[${WhiteSpaceCharacterCodePoints.map((cp) => String.fromCodePoint(cp)).join(
    ""
  )}]*$`,
  "u"
);

interface State<T> {
  array: T[];
  index: number;
}

interface Result<T, A> {
  state: State<T>;
  value: A;
}

type Decoder<T, A> = (state: State<T>) => Result<T, A>;

type Decoders<T, A> = {
  [K in keyof A]: Decoder<T, A[K]>;
};

const pure =
  <A>(value: A) =>
  <T>(state: State<T>): Result<T, A> => ({ state, value });

const map =
  <T, A, B extends unknown[], C>(
    morphism: (value: A, ...values: B) => C,
    firstDecoder: Decoder<T, A>,
    ...restDecoders: Decoders<T, B>
  ): Decoder<T, C> =>
  (state) => {
    const { state: firstState, value } = firstDecoder(state);
    let currentState = firstState;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- correct type
    const values = restDecoders.map((decoder) => {
      const result = decoder(currentState);
      currentState = result.state;
      return result.value;
    }) as B;
    return { state: currentState, value: morphism(value, ...values) };
  };

const alt =
  <T, A, B extends Stream<unknown>>(
    firstDecoder: Decoder<T, A>,
    ...restDecoders: Decoders<T, B>
  ): Decoder<T, A | B[number]> =>
  (state) => {
    const errors: unknown[] = [];
    for (const decoder of [firstDecoder, ...restDecoders]) {
      try {
        return decoder(state);
      } catch (error) {
        errors.push(error);
      }
    }
    throw new AggregateError(errors, "all alternatives failed");
  };

const bind =
  <T, A, B>(
    decoder: Decoder<T, A>,
    arrow: (value: A) => Decoder<T, B>
  ): Decoder<T, B> =>
  (state) => {
    const result = decoder(state);
    return arrow(result.value)(result.state);
  };

type List<A> = Cons<A> | null;

interface Cons<A> {
  head: A;
  tail: List<A>;
}

const toArray = <A>(list: List<A>): A[] => {
  const array: A[] = [];
  for (let cursor = list; cursor !== null; cursor = cursor.tail)
    array.push(cursor.head);
  return array;
};

const toStream = <A>(cons: Cons<A>): Stream<A> => {
  const stream: Stream<A> = [cons.head];
  for (let cursor = cons.tail; cursor !== null; cursor = cursor.tail)
    stream.push(cursor.head);
  return stream;
};

interface Kleene<T, A> {
  plus: Decoder<T, Stream<A>>;
  star: Decoder<T, A[]>;
}

const kleene = <T, A>(decoder: Decoder<T, A>): Kleene<T, A> => {
  const some: Decoder<T, Cons<A>> = bind(decoder, (head) =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define -- mutually recursive
    bind(many, (tail) => pure({ head, tail }))
  );
  // eslint-disable-next-line unicorn/no-null -- empty list
  const many: Decoder<T, List<A>> = alt(some, pure(null));
  return { plus: map(toStream, some), star: map(toArray, many) };
};

const some = <T, A>(decoder: Decoder<T, A>) => kleene(decoder).plus;

const many = <T, A>(decoder: Decoder<T, A>) => kleene(decoder).star;

const at = <T>(array: T[], index: number): T => {
  const element = array.at(index);
  if (typeof element === "undefined")
    throw new Error("unexpected end of input");
  return element;
};

const decode = <T, A>(decoder: Decoder<T, A>, array: T[]) => {
  const { state, value } = decoder({ array, index: 0 });
  if (state.index < array.length) throw new Error("all input not decoded");
  return value;
};

const text: Decoder<Data, string> = ({ array, index }) => {
  const data = at(array, index);
  if (typeof data !== "string") throw new Error("expected text");
  return { state: { array, index: index + 1 }, value: data };
};

const group =
  <A>(decoder: Decoder<TaggedContent, A>): Decoder<Data, A> =>
  ({ array, index }) => {
    const data = at(array, index);
    if (typeof data === "string") {
      if (!WhiteSpaceRegExp.test(data))
        throw new Error("expected tagged content group");
      const nextData = at(array, index + 1);
      // istanbul ignore if -- impossible to test because text never follows text
      if (typeof nextData === "string")
        throw new Error("expected tagged content group");
      return {
        state: { array, index: index + 2 },
        value: decode(decoder, nextData)
      };
    }
    return { state: { array, index: index + 1 }, value: decode(decoder, data) };
  };

const tagged = <A>(
  id: string,
  decoder: Decoder<Data, A>
): Decoder<TaggedContent, A> => {
  const normalizedId = id.normalize("NFC");
  return ({ array, index }) => {
    const { tag, content } = at(array, index);
    if (tag !== normalizedId)
      throw new Error(`expected ${normalizedId} tagged content`);
    const result = decoder({ array: content, index: 0 });
    const remaining = content.length - result.state.index;
    if (remaining > 1) throw new Error("all input not decoded");
    if (remaining === 1) {
      const last = at(content, -1);
      if (typeof last !== "string" || !WhiteSpaceRegExp.test(last))
        throw new Error("all input not decoded");
    }
    return {
      state: { array, index: index + 1 },
      value: result.value
    };
  };
};

export type { State, Result, Decoder, Decoders, Kleene };
export {
  pure,
  map,
  alt,
  bind,
  kleene,
  some,
  many,
  decode,
  text,
  group,
  tagged
};
