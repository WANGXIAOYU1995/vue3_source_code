import { hasChanged, isObject } from "@vue/shared";
import { Link, trackRef, triggerRef } from "./system";
import { reactive } from "./reactive";

enum ReactiveFlags {
    IS_REF = '__v_isRef'
}
// 链表节点


class RefImpl {
    _value
    [ReactiveFlags.IS_REF] = true // 标识
    subs: Link   //subscribers(订阅者) 此处存储当前依赖的副作用函数effect
    // 尾节点
    subsTail: Link
    constructor(value) {
        this._value = value
        // 如果value是一个对象走reactive的代理  否则走value
        this._value = isObject(value) ? reactive(value) : value
    }
    get value() {
        // 收集依赖
        trackRef(this)
        return this._value
    }
    set value(newValue) {
        if (hasChanged(this._value, newValue)) {
            this._value = isObject(newValue) ? reactive(newValue) : newValue
            triggerRef(this)
        }
    }
}

export function ref(value) {
    return new RefImpl(value)
}
export function isRef(value) {
    return !!(value && value[ReactiveFlags.IS_REF])
} 