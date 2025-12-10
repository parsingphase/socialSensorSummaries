import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import fs from "fs";

type Margins = { top: number; left: number; bottom: number; right: number };

export abstract class ChartImageBuilder {
  protected canvasWidth: number;
  protected canvasHeight: number;

  /**
   * Offset from top-left
   * @protected
   */
  protected graphOffset: { x: number; y: number };

  protected graphWidth: number;
  protected graphHeight: number;
  protected title: string;

  protected bgColor = "rgb(230,230,230)";
  protected fgColor = "rgb(245,245,230)";
  protected textColor = "rgb(0,0,0)";
  protected titleFont = "20px Impact";
  protected labelFont = "12px Impact";

  protected canvas: Canvas;
  protected context2d: CanvasRenderingContext2D;

  constructor(canvasWidth: number, canvasHeight: number, title: string, graphFrame?: Margins) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.title = title;

    if (!graphFrame) {
      graphFrame = { top: 60, left: 60, bottom: 90, right: 40 };
    }

    this.graphOffset = {
      x: graphFrame.left,
      y: graphFrame.top,
    };

    this.graphWidth = Math.floor(canvasWidth - graphFrame.left - graphFrame.right);
    this.graphHeight = Math.floor(canvasHeight - graphFrame.top - graphFrame.bottom);

    // Setup key context
    this.canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.context2d = this.canvas.getContext("2d");
  }

  /**
   * Draw the chart to its canvas
   */
  public abstract drawGraph(): Canvas;

  public writeToPng(filename: string): void {
    const fileData = this.canvasAsPng();
    fs.writeFileSync(filename, fileData);
  }

  /**
   * Draw canvas and return as a buffer.
   *
   * @private
   */
  public canvasAsPng(): Buffer {
    return this.canvas.toBuffer("image/png");
  }

  /**
   * Fill background and draw title
   * @protected
   */
  protected drawTitleAndBackground(): void {
    const ctx = this.context2d;

    // Set core colors, fonts
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.fillStyle = this.textColor;
    ctx.font = this.titleFont;
    const textMeasure = ctx.measureText(this.title);
    const textHeight = textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent;
    ctx.fillText(
      this.title,
      (this.canvasWidth - textMeasure.width) / 2,
      textHeight / 2 + this.graphOffset.y / 2
    );
  }

  /**
   * Draw the frame of the graph itself
   * @protected
   */
  protected drawInnerFrame(): void {
    const ctx = this.context2d;

    ctx.fillStyle = this.fgColor;
    ctx.fillRect(this.graphOffset.x, this.graphOffset.y, this.graphWidth, this.graphHeight);
    ctx.strokeStyle = "rgb(100,100,100)";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.graphOffset.x, this.graphOffset.y, this.graphWidth, this.graphHeight);
  }
}

/**
 * Get the smallest step size where the number of steps won't exceed maxSteps over range
 * @param range
 * @param maxSteps
 */
export function stepSizeForValueRange(range: number, maxSteps: number): number {
  let stepSize = 1;
  let exponent = 0;

  stepGen: while (true) {
    for (const multiple of [1, 2, 5]) {
      stepSize = multiple * Math.pow(10, exponent);
      const numSteps = range / stepSize;
      // keep decreasing numSteps until it's lower than maxSteps
      if (maxSteps >= numSteps) {
        break stepGen;
      }
    }
    exponent++;
  }

  console.log({ stepSize, range, maxSteps });
  return stepSize;
}
