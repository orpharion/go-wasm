import Go, {IGo} from './go'
import Global, {IGlobal, IGlobalPartial, fill} from './global'

// todo consider add go to global-like.
/**
 * Create a new Go process runner, and return the (possibly new) global context for it.
 * @param glb: Global onto which to apply, otherwise taken as globalThis
 * @constructor
 */
export default function New(glb?: IGlobalPartial): [IGlobal, IGo] {
    const fromGlobal = !glb
    const glb_ = fromGlobal ? fill(globalThis) : new Global(glb)
    return [glb_, new Go(glb_)]
}

