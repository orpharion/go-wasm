import {IGlobal} from "./global"
import {IGo} from './go'

export type Values =
    | [
    typeof NaN,
    0,
    null,
    true,
    false,
    IGlobal,
    IGo,]
    | []