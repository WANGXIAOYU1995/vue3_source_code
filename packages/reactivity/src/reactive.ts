import { isObject } from "@vue/shared"
import { Link, link, propagete } from "./system"
import { activeSub } from "./effect"

export function reactive(target) {
    return createReactiveObject(target)
}

function createReactiveObject(target) {
    if (!isObject) {
        return target
    }
    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            track(target, key)
            return Reflect.get(target, key, receiver)
        },
        set(target, key, value) {
            // const res = target[key] = value
            const res = Reflect.set(target, key, value)
            trigger(target, key)
            return res
        }
    }
    )
    return proxy
}
class Dep {
    subs: Link
    subsTail: Link

}
// 定义一个函数track
const targetMap = new WeakMap()
function track(target, key) {
    if (!activeSub) return
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, depsMap = new Map())
    }
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, dep = new Dep())
    }
    // 收集依赖
    link(dep, activeSub)
    console.log('dep :>> ', dep);
}
function trigger(target, key) {
    const depsMap = targetMap.get(target)
    if (!depsMap) {
        return
    }
    const dep = depsMap.get(key)
    if (!dep) {
        return
    }
    // 触发依赖
    propagete(dep.subs)
}