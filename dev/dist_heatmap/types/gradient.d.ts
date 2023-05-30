import { CSSColorKeyword } from "./css";
import Color from "color";
/**
 * A byte array that stores each color value as 4 bytes repeating.
 * Each byte corresponds to red, green, blue, and alpha in that order
 */
export type Gradient = Uint8ClampedArray;
/** Represents the gradient stops for a color gradient. */
export type GradientStops = Readonly<Record<number, CSSColorKeyword> | Record<number, CSSColorKeyword | string | number | Color>> | readonly CSSColorKeyword[] | readonly (CSSColorKeyword | string | number | Color)[];
//# sourceMappingURL=gradient.d.ts.map