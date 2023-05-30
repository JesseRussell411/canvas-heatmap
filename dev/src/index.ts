import HeatmapGenerator from "../dist_heatmap/HeatmapGenerator.js";
import { CanvasLike } from "../../dist/types/canvas.js";
const rootElement = document.documentElement;

function copyCanvas(src: CanvasLike, dst: CanvasLike) {
    const imageData = src
        .getContext("2d")
        ?.getImageData(0, 0, src.width, src.height);
    if (imageData == null) throw new Error("couldn't get image data");

    const dstCtx = dst.getContext("2d");
    if (dstCtx == null) throw new Error("couldn't put image data");

    dstCtx.putImageData(imageData, 0, 0, 0, 0, dst.width, dst.height);
}

function getMouseCoords(
    element: Element,
    event: MouseEvent
): [x: number, y: number, insideElement: boolean] {
    const rect = element.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const insideElement = 0 <= x && x < rect.width && 0 <= y && y < rect.height;

    return [x, y, insideElement];
}

// keep track of mouse pointer
const mouseCoords: [x: number, y: number] = [0, 0];
rootElement.addEventListener("mousemove", (e) => {
    const coords = getMouseCoords(rootElement, e);
    mouseCoords[0] = coords[0];
    mouseCoords[1] = coords[1];
});

// create canvases and heatmaps
const heatmapCanvas = document.querySelector("#heatmap");
if (!(heatmapCanvas instanceof HTMLCanvasElement)) {
    throw new Error("canvas not found");
}
const heatmap = new HeatmapGenerator(heatmapCanvas, ["blue", "yellow", "red"]);

const heatmapGrayscaleCanvas = new OffscreenCanvas(
    heatmapCanvas.width,
    heatmapCanvas.height
);
const heatmapGrayscale = new HeatmapGenerator(heatmapGrayscaleCanvas);

// start drawing interval
const targetFps = 30;
setInterval(() => {
    const rect = heatmapCanvas.getBoundingClientRect();
    const x = mouseCoords[0] - rect.left;
    const y = mouseCoords[1] - rect.top;

    heatmapGrayscale.drawPoint(x, y, 10, 45, 1 / targetFps);
    copyCanvas(heatmapGrayscaleCanvas, heatmapCanvas);
    heatmap.colorize();
}, 1000 / targetFps);
