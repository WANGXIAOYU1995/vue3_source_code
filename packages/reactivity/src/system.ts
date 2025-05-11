import { ReactiveEffect } from "vue"
import { activeSub } from "./effect"

interface Sub {
    deps: Link | undefined
    depsTail: Link | undefined
}
interface Dep {
    subs: Link | undefined
    subsTail: Link | undefined
}
export interface Link {
    sub: Sub
    nextSub: Link | undefined
    prevSub: Link | undefined
    dep: Dep
    nextDep: Link | undefined
}
export function link(dep, sub) {
    // 依赖收集时去effect存放的deps链表关系中找到可以复用的dep，如果和当前传入的dep相同表示可以服用newLink节点 那么就不需要走下面的创建了
    // 三元代表 如果只有一个dep 此时只会产生一个link所以没有尾节点，如果有两个dep 比如 flag count 会产生两个的情况 取尾节点的下一个节点进行复用
    // currentDep 代表可以复用的link节点
    const currentDep = sub.depsTail === undefined ? sub.deps : sub.depsTail.nextDep
    if (currentDep && currentDep.dep === dep) {
        console.log('复用了节点');
        return
    }
    const newLink = {
        sub,
        dep,
        nextDep: undefined,
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
    // 建立 deps和link的链表关系 此处是单项链表，不需要关注link的上一个节点，将尾指针移动到需要复用的节点即可
    if (sub.depsTail) {
        sub.depsTail.nextDep = newLink
        sub.depsTail = newLink
    } else {
        sub.deps = newLink
        sub.depsTail = newLink
    }
}
// 收集依赖  
export function trackRef(dep) {
    if (activeSub) {
        link(dep, activeSub)
    }
}
// 触发ref关联的effect重新执行
export function triggerRef(dep) {
    // 链表头节点
    if (dep.subs) {
        propagete(dep.subs)
    }
}
function propagete(subs) {
    let link = subs
    const queueEffect = []
    while (link) {
        queueEffect.push(link.sub)
        link = link.nextSub
    }
    queueEffect.forEach(effect => effect.notify())
}