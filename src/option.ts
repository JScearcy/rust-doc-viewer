
export class Option<T> {
    private wrappedVal: T | null | undefined;

    constructor(val?: T | null) {
        this.wrappedVal = val;
    }

    static lift<T>(val?: T): Option<T> {
        return new Option<T>(val);
    }

    static isValue<T>(val: Option<T>) {
        return val.wrappedVal !== null && val.wrappedVal !== undefined;
    }

    map(fn: (val: T) => T): Option<T> {
        if (this.wrappedVal !== null && this.wrappedVal !== undefined) {
            this.wrappedVal = fn(this.wrappedVal);
        }

        return this;
    }

    unwrap(): T {
        if (this.wrappedVal) {
            return this.wrappedVal;
        } else {
            throw new Error('Value was not defined');
        }
    }
}