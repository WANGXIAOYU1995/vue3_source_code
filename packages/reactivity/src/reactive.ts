import { hasChanged, isObject } from "@vue/shared"
import { Link, link, propagete } from "./system"
import { activeSub } from "./effect"
import { isRef } from "./ref"
import { mutablaHandlers } from './baseHandlers'
// proxy reactive对象
const reactiveMap = new WeakMap()
const reactiveSet = new WeakSet()
export function reactive(target) {
    return createReactiveObject(target)
}

function createReactiveObject(target) {
    if (!isObject) {
        return target
    }
    // 看下reactive有没有被代理过，避免被重复代理  
    const existingProxy = reactiveMap.get(target)
    if (existingProxy) {
        return existingProxy
    }
    // 看一下target是不是响应式对象
    if (reactiveSet.has(target)) {
        return target
    }
    const proxy = new Proxy(target, mutablaHandlers)
    reactiveMap.set(target, proxy)
    reactiveSet.add(proxy)
    return proxy
}


/** 判断是不是响应式 在reactiveSet中就是响应式 */
export function isReactive(target) {
    return reactiveSet.has(target)
}