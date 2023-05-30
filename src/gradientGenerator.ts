import { GradientStops, Gradient } from "./types/gradient";
import Color from "color";

export const defaultGradientStops: GradientStops = {
    1: "red",
    0.5: "yellow",
    0: "blue",
} as const;

export const defaultGradient = generateGradient(defaultGradientStops);


/**
 * Generates a {@link Gradient} from the provided color stops.
 * @param colorStops An object where the key is a color stop's offset and the value is its color.
 * @returns A {@link Gradient}.
 */
export function generateGradient(
    colorStops?: GradientStops
): Uint8ClampedArray {
    if (undefined === colorStops) return defaultGradient;

    if (Array.isArray(colorStops)) {
        // convert array of color stops to object
        
        // special case of 1 color stop
        if (colorStops.length === 1){
            return generateGradient({
                0: colorStops[0]
            })
        }

        const colorStopsObject = Object.fromEntries(
            colorStops.map((color, i) => [i / (colorStops.length - 1), color])
        );
        return generateGradient(colorStopsObject);
    }

    /** The byte array that will eventually contain the gradient. */
    const result = new Uint8ClampedArray(256 * 4);

    /** A color stop that has been shaped to a consistent object. */
    type PreppedColorStop = readonly [
        offset: number,
        color: Readonly<{
            red: number;
            green: number;
            blue: number;
            alpha: number;
        }>
    ];

    const preppedColorStops: PreppedColorStop[] = Object.entries(colorStops)
        // object keys are strings, parse them to numbers
        .map(stop => [parseFloat(stop[0]), stop[1]] as const)
        // remove NaN offsets
        .filter(stop => !Number.isNaN(stop[0]))
        // final shaping of the color stops
        .map(stop => {
            // parse the color string using the color package from npm
            const color =
                stop[1] instanceof Color ? stop[1] : new Color(stop[1]);

            return [
                stop[0],
                // get the red,green,blue,alpha values from the color objects
                {
                    red: color.red(),
                    green: color.green(),
                    blue: color.blue(),
                    alpha: color.alpha() * 255,
                },
            ] as const;
        });

    // if there where no color stops return a blank gradient
    if (preppedColorStops.length === 0) return result;

    // sort the color stops by their offset (ascending)
    preppedColorStops.sort((a, b) => a[0] - b[0]);

    // convert the color stop offsets from 0 - 1 to 0 - 255
    // have to cast stop to non-readonly to do this.
    preppedColorStops.forEach(
        stop => ((stop as [...PreppedColorStop])[0] *= 255)
    );

    // if there's no stop for 0, add one and if there's no stop for 255, add that one too.
    if (preppedColorStops[0]![0] > 0) {
        preppedColorStops.unshift([
            0,
            { red: 0, green: 0, blue: 0, alpha: 0 },
        ] as const);
    }
    if (preppedColorStops[preppedColorStops.length - 1]![0] < 255) {
        preppedColorStops.push([
            255,
            { red: 0, green: 0, blue: 0, alpha: 0 },
        ] as const);
    }

    // *at this point, there must be at least 2 color stops in the color stop array.

    /** The index of the color stop preceding i. */
    let colorStop1i = 0;
    /** The index of the color stop following i. */
    let colorStop2i = 1;

    // calculate the color for each value from 0 to 255.
    for (let i = 0; i < 256; i++) {
        // check if i is past the following color stop and increment the color stops if it is.
        // While-loop incase of color stops less than 1 apart (200, 200.2).
        // *thanks to the format of this function, it is impossible for color stops to have duplicate
        // offsets, unless the user disobeys typescript and uses strings for the keys to the colorStops
        // argument. Then they could enter: {["1"]: "red", ["1.0"]: "green"} but this probably wouldn't
        // cause a crash.
        while (i > preppedColorStops[colorStop2i]![0]) {
            colorStop1i++;
            colorStop2i++;
        }
        /** The preceding color stop. */
        const colorStop1 = preppedColorStops[colorStop1i]!;
        /** The following color stop. */
        const colorStop2 = preppedColorStops[colorStop2i]!;

        /** The distance from i to the preceding color stop. */
        const colorStopDistance1 = Math.abs(i - colorStop1[0]);
        /** the distance from i to the following color stop. */
        const colorStopDistance2 = Math.abs(colorStop2[0] - i);

        const totalDistance = colorStopDistance1 + colorStopDistance2;

        // calculate each channel's value
        const ri = i * 4;

        // incase of duplicate offsets where they are on top of each other and the distance between them is 0
        // and i is also on top of them, at the same value as the two offset
        // I hope the CPU's branch prediction figures out that is is almost always false
        if (totalDistance === 0) {
            let chnl: "red" | "green" | "blue" | "alpha";

            chnl = "red";
            result[ri + 0] = (colorStop1[1][chnl] + colorStop2[1][chnl]) / 2;

            chnl = "green";
            result[ri + 0] = (colorStop1[1][chnl] + colorStop2[1][chnl]) / 2;

            chnl = "blue";
            result[ri + 0] = (colorStop1[1][chnl] + colorStop2[1][chnl]) / 2;

            chnl = "alpha";
            result[ri + 0] = (colorStop1[1][chnl] + colorStop2[1][chnl]) / 2;
        } else {
            result[ri + 0] = calcChannel(
                "red",
                colorStop1,
                colorStop2,
                colorStopDistance1,
                colorStopDistance2,
                totalDistance
            );
            result[ri + 1] = calcChannel(
                "green",
                colorStop1,
                colorStop2,
                colorStopDistance1,
                colorStopDistance2,
                totalDistance
            );
            result[ri + 2] = calcChannel(
                "blue",
                colorStop1,
                colorStop2,
                colorStopDistance1,
                colorStopDistance2,
                totalDistance
            );
            result[ri + 3] = calcChannel(
                "alpha",
                colorStop1,
                colorStop2,
                colorStopDistance1,
                colorStopDistance2,
                totalDistance
            );
        }
    }

    // I hope this function gets inlined
    /** Calculate the value for a channel. */
    function calcChannel(
        channel: "red" | "green" | "blue" | "alpha",
        colorStop1: PreppedColorStop,
        colorStop2: PreppedColorStop,
        colorStopDistance1: number,
        colorStopDistance2: number,
        totalDistance: number
    ) {
        /** The influence from the preceding stop. */
        const color1 = colorStop1[1][channel] * colorStopDistance2;
        /** The influence from the following stop. */
        const color2 = colorStop2[1][channel] * colorStopDistance1;

        // the reason why there's a check for totalDistance === 0 above
        /** The average of the two influences. */
        const totalColor = (color1 + color2) / totalDistance;

        // clean up the result to make sure it is an integer from 0 to 255
        return Math.max(0, Math.min(255, Math.round(totalColor)));
    }

    return result;
}
