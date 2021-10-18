import {IGlobalIn} from "../go"
import {IGo} from '../go'

export type Values =
    | [
    typeof NaN,
    0,
    null,
    true,
    false,
    IGlobalIn,
    IGo,]
    | []