import { ReactiveEffect } from "vue"
import { activeSub } from "./effect"
// 依赖项  有可能是ref 也可能是reactive     
// flag count 作为ref在一个effect会进行两次依赖收集，创建两个link节点，同时通过往 flag count的dep（ref的this）增加subsTail和subs属性，将activeEffect进行关联（防止嵌套effect）
// 这两个link节点中，每个link节点中 存放sub ，sub为ref数据收集到的activeeffect（effect实例），
// 这个effect呢里面存放了deps depsTail  其实是activeEffect（只有一个effect）与当前的link1 link2，如果只有一个link节点，那么run 的时候就可以判断 effect中存放的deps（头节点 ）中的dep是否与当前的link1 link2的dep相同，如果相同则复用。
// 如果有两个link节点，比如 flag和count 依赖收集的link节点，那么就取effect的depsTail 尾节点的nextDep作为复用节点
//
interface Dep {
    // 订阅者列表 头结点和尾节点
    subs: Link | undefined
    subsTail: Link | undefined
}
interface Sub {
    deps: Link | undefined
    depsTail: Link | undefined
}
export interface Link {
    sub: Sub
    nextSub: Link | undefined
    prevSub: Link | undefined
    dep: Dep
    nextDep: Link | undefined
}
export function link(dep, sub) {
    // 取当前的 effect实例的 deps依赖项尾节点 没有尾结点时对比头节点是否相同，相同则复用
    const currentDep = sub.depsTail
    // 可以复用的节点
    const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
    if (nextDep && nextDep.dep === dep) {
        sub.depsTail = nextDep
        return
    }
    const newLink = {
        sub,
        dep,
        nextDep,
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

    // 将链表节点和dep建立关联关系
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