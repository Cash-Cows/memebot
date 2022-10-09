"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Direction = exports.ImageData = exports.Image = exports.Canvas = void 0;
const canvas_1 = require("canvas");
Object.defineProperty(exports, "Canvas", { enumerable: true, get: function () { return canvas_1.Canvas; } });
Object.defineProperty(exports, "Image", { enumerable: true, get: function () { return canvas_1.Image; } });
Object.defineProperty(exports, "ImageData", { enumerable: true, get: function () { return canvas_1.ImageData; } });
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Down"] = 1] = "Down";
})(Direction = exports.Direction || (exports.Direction = {}));
;
