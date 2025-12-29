#!/usr/bin/env npx ts-node --esm -r tsconfig-paths/register

import * as fs from "node:fs";
import { createCanvas } from "canvas";

const canvas = createCanvas(200, 200);
const ctx = canvas.getContext("2d");

ctx.fillStyle = "rgb(200,255,255)";
ctx.fillRect(0, 0, 200, 200);

// Write "Awesome!"
ctx.fillStyle = "rgb(0,0,0)";
ctx.font = "30px Impact";
ctx.rotate(0.1);
ctx.fillText("Awesome!", 50, 100);

// Draw line under text
const text = ctx.measureText("Awesome!");
ctx.strokeStyle = "rgba(0,0,0,0.5)";
ctx.beginPath();
ctx.lineTo(50, 102);
ctx.lineTo(50 + text.width, 102);
ctx.stroke();

const fileData = canvas.toBuffer("image/png");
fs.writeFileSync(`${__dirname}/../tmp/test.png`, fileData);
