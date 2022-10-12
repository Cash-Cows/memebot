"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
require("./routes");
require("./events");
const port = process.env.PORT || 3001;
utils_1.app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
