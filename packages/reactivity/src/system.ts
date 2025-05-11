import { ReactiveEffect } from "vue"
import { activeSub } from "./effect"

export interface Link {
    sub: ReactiveEffect
    nextSub: Link | undefined
    prevSub: Link | undefined
}
export function track(dep) {
    const newLink = {
        sub: activeSub,
        nextSub: undefined,
        prevSub: undefined
    }
    // 将保存了当前effect依赖的节点，添加到双向链表
    if (dep.subsTail) {
        // 如果有尾节点 将尾节点的next指向新节点 将新节点的prev指向尾节点 将尾节点指针指向新节点
        dep.subsTail.nextSub = newLink
        newLink.prevSub = dep.subsTail
        dep.subsTail = newLink
    } else {
        dep.subs = newLink
        dep.subsTail = newLink
    }
}
export function triggerRef(dep) {
    let link = dep.subs
    const queueEffect = []
    while (link) {
        queueEffect.push(link.sub)
        link = link.nextSub
    }
    queueEffect.forEach(effect => effect.notify())
}