import { activeSub } from "./effect";
import { Link, track, triggerRef } from "./system";

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
    }
    get value() {
        // 收集依赖
        if (activeSub) {
            track(this)
        }
        return this._value
    }
    set value(newValue) {
        this._value = newValue
        triggerRef(this)
    }
}

export function ref(value) {
    return new RefImpl(value)
}
export function isRef(value) {
    return !!(value && value[ReactiveFlags.IS_REF])
} 