import { GradientStops } from "./types/gradient";
export declare const defaultGradientStops: GradientStops;
export declare const defaultGradient: Uint8ClampedArray;
/**
 * Generates a {@link Gradient} from the provided color stops.
 * @param colorStops An object where the key is a color stop's offset and the value is its color.
 * @returns A {@link Gradient}.
 */
export declare function generateGradient(colorStops?: GradientStops): Uint8ClampedArray;
//# sourceMappingURL=gradientGenerator.d.ts.map