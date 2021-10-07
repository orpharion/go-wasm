import {IProcess} from "./process";

export interface IPerformance {
    now(): number
}

type IGlobal = {
    process: IProcess
}

export default class Performance implements IPerformance {
    _global: IGlobal

    constructor(g: IGlobal) {
        this._global = g
    }

    now() {
        const [sec, nsec] = this._global.process.hrtime();
        return sec * 1000 + nsec / 1000000;
    }
}