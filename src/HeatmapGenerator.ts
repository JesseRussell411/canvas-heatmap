import { defaultGradientStops, generateGradient } from "./gradientGenerator";
import { CanvasLike, CanvasRenderingContext2DLike } from "./types/canvas";
import { Gradient, GradientStops } from "./types/gradient";

/**
 * Draws a heatmap onto a canvas or a 2d canvas drawing context.
 * This canvas or context only needs to implement the needed methods.
 * It can be a node-canvas, skia-canvas, browser canvas, OffscreenCanvas,
 * or possibly any other canvas. Try it and see if it works.
 */
export default class HeatmapGenerator {
    private readonly context: CanvasRenderingContext2DLike;
    private gradientData: Uint8ClampedArray;
    private userGradient: GradientStops;
    private readonly width: number;
    private readonly height: number;

    public constructor(
        ...args:
            | [
                  context: CanvasRenderingContext2DLike,
                  width: number,
                  height: number,
                  gradientStops?: GradientStops
              ]
            | [canvas: CanvasLike, gradient?: GradientStops]
    ) {
        if (args.length === 1 || args.length === 2) {
            const [canvas, gradient = defaultGradientStops] = args;

            const context = canvas.getContext("2d");
            if (null === context) throw new Error("getContext returned null");

            this.context = context;
            this.width = canvas.width;
            this.height = canvas.height;
            this.userGradient = gradient;
            this.gradientData = generateGradient(gradient);
        } else if (args.length === 3 || args.length === 4) {
            const [context, width, height, gradient = defaultGradientStops] =
                args;

            this.context = context;

            this.width = width;
            this.height = height;
            this.userGradient = gradient;
            this.gradientData = generateGradient(gradient);
        } else {
            throw new Error("incorrect number of arguments");
        }
    }

    public get gradient(): GradientStops {
        return this.userGradient;
    }

    public set gradient(value: GradientStops) {
        this.gradientData = generateGradient(value);
        this.userGradient = value;
    }

    /**
     * Draws a grid of points on the heatmap.
     * @param data A 2d array of normalized (0.0 to 1.0) data points stored as an array of rows.
     * The number of columns is determined by the length of the first row. If there are no rows,
     * then the number of columns is determined to be 0.
     */
    public drawPointGrid(
        data: readonly (readonly number[])[],
        {
            radius1 = 0.25,
            radius2 = 0.75,
        }: { radius1?: number; radius2?: number } = {}
    ): void {
        if (this.width === 0 || this.height === 0) return;
        const rows = data.length;
        const columns = data[0]?.length ?? 0;

        const columnWidth = this.width / columns;
        const rowHeight = this.height / rows;

        const averageScale = (columnWidth + rowHeight) / 2;

        const r1 = averageScale * radius1;
        /** d2 */
        const r2 = averageScale * radius2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                const x = (c + 0.5) * columnWidth;
                const y = (r + 0.5) * rowHeight;
                const value = data[r]?.[c] ?? 0;
                this.drawPoint(x, y, r1, r2, value);
            }
        }
    }

    /**
     * Draw a single point on the heatmap
     *
     * @param x The x coordinate of the point.
     * @param y The y coordinate of the point.
     * @param r1 The inner, solid radius of the point.
     * @param r2 The outer, gradient radius of the point.
     * @param alpha Strength of the point from 0.0 to 1.0.
     */
    public drawPoint(
        x: number,
        y: number,
        r1: number,
        r2: number,
        alpha: number
    ): void {
        if (this.width === 0 || this.height === 0) return;

        const grd = this.context.createRadialGradient(x, y, r1, x, y, r2);
        grd.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grd.addColorStop(1, "rgba(255, 255, 255, 0)");

        this.context.fillStyle = grd;
        const fullRadius = Math.max(r1, r2);
        this.context.fillRect(
            x - fullRadius,
            y - fullRadius,
            fullRadius * 2,
            fullRadius * 2
        );
    }

    /**
     * Colorizes the heatmap. Before calling this function, the heatmap is grayscale.
     */
    public colorize(
        gradient: GradientStops | Gradient = this.gradientData,
        { transparent = false }: { transparent?: boolean } = {}
    ): void {
        if (!(gradient instanceof Uint8ClampedArray)) {
            return this.colorize(generateGradient(gradient), { transparent });
        }

        if (this.width === 0 || this.height === 0) return;
        const imageData = this.context.getImageData(
            0,
            0,
            this.width,
            this.height
        );
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const strength = data[i + 3]!;
            const red = gradient[strength * 4 + 0]!;
            const green = gradient[strength * 4 + 1]!;
            const blue = gradient[strength * 4 + 2]!;
            const alpha = gradient[strength * 4 + 3]!;

            data[i + 0] = red;
            data[i + 1] = green;
            data[i + 2] = blue;
            data[i + 3] = alpha;
        }

        this.context.putImageData(imageData, 0, 0);
    }

    public decolorize(
        gradient: GradientStops | Gradient = this.gradientData,
        { transparent = false }: { transparent?: boolean } = {}
    ): void {
        if (!(gradient instanceof Uint8ClampedArray)) {
            return this.decolorize(generateGradient(gradient));
        }

        const getKey = transparent
            ? (i: number, gradient: Gradient) =>
                  `${gradient[i + 0]}${gradient[i + 1]}${gradient[i + 2]}`
            : (i: number, gradient: Gradient) =>
                  `${gradient[i + 0]}${gradient[i + 1]}${gradient[i + 2]}${
                      gradient[i + 3]
                  }`;

        // create reverse gradient
        const reverseGradient = new Map<string, number>();
        for (let i = 0; i < gradient.length; i += 4) {
            reverseGradient.set(getKey(i, gradient), i);
        }

        
    }

    /**
     * Removes all transparency from the heatmap.
     */
    public makeOpaque() {
        if (this.width === 0 || this.height === 0) return;
        const imageData = this.context.getImageData(
            0,
            0,
            this.width,
            this.height
        );
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i + 3] = 255;
        }
        this.context.putImageData(imageData, 0, 0);
    }
}
