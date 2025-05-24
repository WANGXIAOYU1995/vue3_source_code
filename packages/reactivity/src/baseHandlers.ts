import { hasChanged, isObject } from "@vue/shared"
import { activeSub } from "./effect"
import { propagete, Link, link } from "./system"
import { isRef } from "./ref"
import { reactive } from "./reactive"
/** 把mutablaHandlers存起来  避免每次重复创建这个对象*/
export const mutablaHandlers = {
    get(target, key, receiver) {
        track(target, key)
        const res = Reflect.get(target, key, receiver)
        if (isRef(res)) {
            return res.value
        }
        /**  如果取到的值还是一个对象 那么就把他包装成reactive  避免 reactive(a:{b:1}) 改a.b没反应*/
        if (isObject(res)) {
            return reactive(res)
        }
        return res
    },
    set(target, key, newValue, receiver) {
        const oldValue = target[key]
        const res = Reflect.set(target, key, newValue, receiver)
        // 如果新值和老值不一样 触发更新
        // if(oldValue !== newValue) {
        /** 如果更新了state.a 它之前是个ref那么会修改原始的ref.value的值=newValue
         * 如果newValue是一个ref那就算了
         */
        if (isRef(oldValue) && !isRef(newValue)) {
            oldValue.value = newValue
            // 改了oldValue 他是一个ref会自动触发更新 所以要返回res 否则会重复通知执行两次effect
            return res
        }
        if (hasChanged(oldValue, newValue)) {
            trigger(target, key)
            return res
        }
    }
}
// 定义一个函数track
const targetMap = new WeakMap()
export function track(target, key) {
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
export function trigger(target, key) {
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
class Dep {
    subs: Link
    subsTail: Link
}