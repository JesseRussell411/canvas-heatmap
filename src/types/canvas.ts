/**
 * Like a canvas.
 */
export interface CanvasLike {
    readonly width: number;
    readonly height: number;
    getContext(...args: any): any;
    // getContext(context: "2d"): CanvasRenderingContext2DLike | null;
}

/**
 * Like a canvas's 2d context.
 */
export interface CanvasRenderingContext2DLike {
    createRadialGradient(
        x0: number,
        y0: number,
        r0: number,
        x1: number,
        y1: number,
        r1: number
    ): CanvasGradientLike;
    createLinearGradient(
        x: number,
        y: number,
        w: number,
        h: number
    ): CanvasGradientLike;
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageDataLike;
    putImageData(imageData: ImageDataLike, dx: number, dy: number): void;
    set fillStyle(value: any);
    fillRect(x: number, y: number, w: number, h: number): void;
}

/**
 * Like a 2d context's gradient object.
 */
export interface CanvasGradientLike {
    addColorStop(offset: number, color: string): void;
}

/**
 * Like a 2d context's image data.
 */
export interface ImageDataLike {
    data: Uint8ClampedArray;
}
