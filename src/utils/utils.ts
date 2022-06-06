import {
  Box,
  Glue,
  INFINITE_STRETCH,
  Item,
  MAX_COST,
  MIN_COST,
  Penalty,
} from "src/breakLines";
import { LineWidth } from "src/html/lineWidth";
import { TexLinebreakOptions } from "src/options";

export interface TextBox extends Box {
  text?: string;
}

export interface TextGlue extends Glue {
  text?: string;
}

export type TextItem = TextBox | TextGlue | Penalty;

export function box(width: number): Box;
export function box(width: number, text: string): TextBox;
export function box(width: number, text?: string): Box | TextBox {
  return { type: "box", width, text };
}

/** (Stretch comes before shrink as in the original paper) */
export function glue(
  width: number,
  stretch: number,
  shrink: number,
  text?: string
): Glue | TextGlue {
  if (text) {
    return { type: "glue", width, shrink, stretch, text };
  } else {
    return { type: "glue", width, shrink, stretch };
  }
}

export function penalty(
  width: number,
  cost: number,
  flagged: boolean = false
): Penalty {
  return { type: "penalty", width, cost, flagged };
}

export function textBox(
  text: string,
  options: TexLinebreakOptions
): TextItem[] {
  if (options.hyphenateFn && !options.onlyBreakOnWhitespace) {
    let out: TextItem[] = [];
    const chunks = options.hyphenateFn(text);
    chunks.forEach((c, i) => {
      out.push(box(options.measureFn(c), c));
      if (i < chunks.length - 1) {
        out.push(...softHyphen(options));
      }
    });
    return out;
  } else {
    return [box(options.measureFn(text), text)];
  }
}

export function textGlue(
  text: string,
  options: TexLinebreakOptions
): TextItem[] {
  const spaceShrink = getSpaceWidth(options) * options.glueShrinkFactor;
  const spaceStretch = getSpaceWidth(options) * options.glueStretchFactor;
  if (options.align === "justify") {
    /** Spaces in justified lines */
    return [glue(getSpaceWidth(options), spaceStretch, spaceShrink, text)];
  } else {
    /**
     * Spaces in ragged lines. See p. 1139.
     * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=21
     * (Todo: Ragged line spaces should perhaps be allowed to stretch
     * a bit, but it should probably still be listed as zero here since
     * otherwise a line with many spaces is more likely to be a good fit.)
     */
    return [
      glue(
        0,
        getLineFinalStretchInNonJustified(options) + spaceStretch,
        spaceShrink,
        text
      ),
      penalty(0, 0),
      glue(
        getSpaceWidth(options),
        -getLineFinalStretchInNonJustified(options),
        0
      ),
    ];
  }
}

export const softHyphen = (options: TexLinebreakOptions): TextItem[] => {
  const hyphenWidth = options.hangingPunctuation ? 0 : options.measureFn("-");
  if (options.align === "justify") {
    return [penalty(hyphenWidth, options.softHyphenPenalty, true)];
  } else {
    /**
     * Optional hyphenations in unjustified text are slightly tricky as:
     * "After the breakpoints have been chosen using the above sequences
     * for spaces and for optional hyphens, the individual lines
     * should not actually be justified, since a hyphen inserted by the
     * ‘penalty(6,500,1)’ would otherwise appear at the right margin." (p. 1139)
     */
    return [
      penalty(0, MAX_COST),
      glue(0, getLineFinalStretchInNonJustified(options), 0),
      penalty(hyphenWidth, options.softHyphenPenalty, true),
      glue(0, -getLineFinalStretchInNonJustified(options), 0),
    ];
  }
};

export const getSpaceWidth = (options: TexLinebreakOptions): number => {
  return options.measureFn(" ");
};
export const getLineFinalStretchInNonJustified = (
  options: TexLinebreakOptions
): number => {
  return getSpaceWidth(options) * options.lineFinalSpacesInNonJustified;
};

/** Todo: Should regular hyphens not be flagged? If so this function doesn't work */
export const isSoftHyphen = (item: Item | undefined): boolean => {
  // Note: Do not take width into account here as it will be zero for hanging punctuation
  return Boolean(item && item.type === "penalty" && item.flagged);
};

export function forcedBreak(): Penalty {
  return penalty(0, MIN_COST);
}

export function isForcedBreak(item: Item) {
  return item.type === "penalty" && item.cost <= MIN_COST;
}

export const isBreakablePenalty = (item: Item) => {
  return item && item.type === "penalty" && item.cost < MAX_COST;
};

export const isNonBreakablePenalty = (item: Item) => {
  return item && item.type === "penalty" && item.cost >= MAX_COST;
};

export const isPenaltyThatDoesNotForceBreak = (item: Item) => {
  return item.type === "penalty" && item.cost > MIN_COST;
};

/**
 * Gets the stretch of a glue, taking into account the setting
 * {@link TexLinebreakOptions#infiniteGlueStretchAsRatioOfWidth}
 */
export const getStretch = (
  input: Glue,
  options: TexLinebreakOptions
): number => {
  return input.stretch;

  if (input.stretch === INFINITE_STRETCH) {
    return (
      options.infiniteGlueStretchAsRatioOfWidth *
      getMaxLineWidth(options.lineWidth)
    );
  } else {
    return input.stretch;
  }
};

/**
 * Used to prevent the last line from having a hanging last line.
 * Note: This results in the paragraph not filling the entire
 * allowed width, but the output will have all lines balanced.
 */
export const removeGlueFromEndOfParagraphs = <T extends Item>(
  items: T[]
): T[] => {
  return items
    .slice()
    .filter(
      (item) => !(item.type === "glue" && item.stretch === INFINITE_STRETCH)
    );
};

/**
 * todo: this adds line-final glue for justified but it should
 * be marked as just extending whatever stretch there already is
 */
export const addSlackIfBreakpoint = (
  stretch: number,
  cost: number = 0
): (Glue | Penalty)[] => {
  return [
    penalty(0, MAX_COST),
    glue(0, stretch, 0),
    penalty(0, cost),
    glue(0, -stretch, 0),
  ];
};

export const infiniteGlue = (): Glue => {
  return glue(0, INFINITE_STRETCH, 0);
};

export const getMinLineWidth = (lineWidths: LineWidth): number => {
  if (Array.isArray(lineWidths)) {
    return Math.min(...lineWidths);
  } else if (typeof lineWidths === "number") {
    return lineWidths;
  } else {
    return Math.min(
      ...[...Object.values(lineWidths), lineWidths.defaultLineWidth]
    );
  }
};

export const getMaxLineWidth = (lineWidths: LineWidth): number => {
  if (Array.isArray(lineWidths)) {
    return Math.max(...lineWidths);
  } else if (typeof lineWidths === "number") {
    return lineWidths;
  } else {
    return Math.max(
      ...[...Object.values(lineWidths), lineWidths.defaultLineWidth]
    );
  }
};

export const getLineWidth = (
  lineWidths: LineWidth,
  lineIndex: number
): number => {
  if (Array.isArray(lineWidths)) {
    if (lineIndex < lineWidths.length) {
      return lineWidths[lineIndex];
    } else {
      /**
       * If out of bounds, return the last width of the last line.
       * This is done since the first line may have indentation.
       */
      return lineWidths.at(-1)!;
    }
  } else if (typeof lineWidths === "number") {
    return lineWidths;
  } else {
    return lineWidths[lineIndex] || lineWidths.defaultLineWidth;
  }
};

export const validateItems = (items: Item[]) => {
  /** Input has to end in a MIN_COST penalty */
  const lastItem = items[items.length - 1];
  if (!(lastItem.type === "penalty" && lastItem.cost <= MIN_COST)) {
    console.log(items.slice(-3));
    throw new Error(
      "The last item in breakLines must be a penalty of MIN_COST, otherwise the last line will not be broken. `splitTextIntoItems` will automatically as long as the `addParagraphEnd` option hasn't been turned off."
    );
  }

  /**
   * Catch a misunderstanding of someone trying to penalize a
   * glue (accidentally placing the penalty after the glue)
   */
  const gluePenaltyBoxIndex = items.findIndex(
    (item, index) =>
      item.type === "glue" &&
      items[index + 1].type === "penalty" &&
      (items[index + 1] as Penalty).cost! > MIN_COST &&
      items[index + 2].type === "box"
  );
  if (gluePenaltyBoxIndex >= 0) {
    console.log(items.slice(gluePenaltyBoxIndex - 2, gluePenaltyBoxIndex + 5));
    throw new Error(
      `It appears you're trying to penalize a glue at index ${gluePenaltyBoxIndex}, but remember that penalty comes before the glue.`
    );
  }

  /** Validate values */
  if (items.some((item) => !item.type)) {
    throw new Error(
      `Missing type for item: ${JSON.stringify(
        items.find((item) => !item.type)
      )}`
    );
  }
  if (items.some((item) => typeof item.width !== "number")) {
    throw new Error(
      `Width must be a number: ${JSON.stringify(
        items.find((item) => !item.type)
      )}`
    );
  }
  if (items.some((item) => item.type === "glue" && !isFinite(item.stretch))) {
    throw new Error(`Glue cannot have infinite stretch`);
  }
};
