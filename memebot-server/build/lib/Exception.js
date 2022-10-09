"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Exception extends Error {
    constructor(message, code = 500) {
        super();
        this.errors = {};
        this.message = message;
        this.name = this.constructor.name;
        this.code = code;
    }
    static for(message, ...values) {
        values.forEach(function (value) {
            message = message.replace('%s', value);
        });
        return new this(message);
    }
    static forErrorsFound(errors) {
        const exception = new this('Invalid Parameters');
        exception.errors = errors;
        return exception;
    }
    static require(condition, message, ...values) {
        if (!condition) {
            for (const value of values) {
                message = message.replace('%s', value);
            }
            throw new this(message);
        }
    }
    withCode(code) {
        this.code = code;
        return this;
    }
}
exports.default = Exception;
