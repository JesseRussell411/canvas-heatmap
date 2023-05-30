import { CanvasLike, CanvasRenderingContext2DLike } from "./types/canvas";
import { Gradient, GradientStops } from "./types/gradient";
/**
 * Draws a heatmap onto a canvas or a 2d canvas drawing context.
 * This canvas or context only needs to implement the needed methods.
 * It can be a node-canvas, skia-canvas, browser canvas, OffscreenCanvas,
 * or possibly any other canvas. Try it and see if it works.
 */
export default class HeatmapGenerator {
    private readonly context;
    private gradientData;
    private userGradient;
    private readonly width;
    private readonly height;
    constructor(...args: [
        context: CanvasRenderingContext2DLike,
        width: number,
        height: number,
        gradientStops?: GradientStops
    ] | [canvas: CanvasLike, gradient?: GradientStops]);
    get gradient(): GradientStops;
    set gradient(value: GradientStops);
    /**
     * Draws a grid of points on the heatmap.
     * @param data A 2d array of normalized (0.0 to 1.0) data points stored as an array of rows.
     * The number of columns is determined by the length of the first row. If there are no rows,
     * then the number of columns is determined to be 0.
     */
    drawPointGrid(data: readonly (readonly number[])[], { radius1, radius2, }?: {
        radius1?: number;
        radius2?: number;
    }): void;
    /**
     * Draw a single point on the heatmap
     *
     * @param x The x coordinate of the point.
     * @param y The y coordinate of the point.
     * @param r1 The inner, solid radius of the point.
     * @param r2 The outer, gradient radius of the point.
     * @param alpha Strength of the point from 0.0 to 1.0.
     */
    drawPoint(x: number, y: number, r1: number, r2: number, alpha: number): void;
    /**
     * Colorizes the heatmap. Before calling this function, the heatmap is grayscale.
     */
    colorize(gradient?: GradientStops | Gradient, { transparent }?: {
        transparent?: boolean;
    }): void;
    decolorize(gradient?: GradientStops | Gradient, { transparent }?: {
        transparent?: boolean;
    }): void;
    /**
     * Removes all transparency from the heatmap.
     */
    makeOpaque(): void;
}
//# sourceMappingURL=HeatmapGenerator.d.ts.map