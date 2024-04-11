export class Error {
    /**
     * code 为错误码
     * message 为错误信息，同时该信息最好能唯一定位该reject的原因
     * 错误在何处发生。比如message为"在xxx处发生错误"，code为"xxx",xxx为发生错误的具体位置,某个类的某个方法。
     * 这样在catch中，可以根据code来判断错误类型，从而进行不同的处理。
     * 同时在各种log日志中也应进行区分日志类型。
     * @param {*} code 
     * @param {*} message 
     */
    constructor(code, message) {
        this.message = message;
        this.code = code;
    }
    // ...
}