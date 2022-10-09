export default class Exception extends Error {
    code: number;
    errors: Record<string, string>;
    static for(message: string, ...values: string[]): Exception;
    static forErrorsFound(errors: Record<string, string>): Exception;
    static require(condition: boolean, message: string, ...values: any[]): void;
    constructor(message: string, code?: number);
    withCode(code: number): Exception;
}
