
enum DEBUG_LEVEL {
    NONE= 0,
    LOGS= 1,
}
export default class Console {
    public DEBUG_LEVEL = DEBUG_LEVEL;
    constructor(readonly SIGNATURE: string, readonly DEBUG: DEBUG_LEVEL = 0) {}

    public log(...args: any[]) {
        this._log("log", args);
    }
    public info(...args: any[]) {
        this._log("info", args);
    }
    public error(...args: any[]) {
        this._log("error", args);
    }
    public warn(...args: any[]) {
        this._log("warn", args);
    }

    private _log(type: "log" | "warn" | "error" | "info", args: any[]) {
        if (this.DEBUG > DEBUG_LEVEL.NONE) {
            if (this.DEBUG === DEBUG_LEVEL.LOGS) {
                window.console[type].bind(window.console)(this.SIGNATURE, ...args);
            } else {
                const location = ((new Error()).stack || "").split("\n").slice(3).join("\n");
                window.console[type].bind(window.console)(this.SIGNATURE, ...args, "\n", location);
            }
        }
    }
}
