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
let linkPool: Link
export function link(dep, sub) {
    // 取当前的 effect实例的 deps依赖项尾节点 没有尾结点时对比头节点是否相同，相同则复用
    const currentDep = sub.depsTail
    // 可以复用的节点
    const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
    if (nextDep && nextDep.dep === dep) {
        sub.depsTail = nextDep
        return
    }
    let newLink;
    if (linkPool) {
        console.log('复用了linkPool');
        // 如果有linkPool说明有没被复用的节点被保存起来了 
        newLink = linkPool
        linkPool = newLink.nextDep
        newLink.sub = sub
        newLink.dep = dep
        newLink.nextDep = nextDep
    } else {
        newLink = {
            sub,
            dep,
            nextDep,
            nextSub: undefined,
            prevSub: undefined
        }
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



// 开始追踪依赖
export function startTrack(sub) {
    sub.depsTail = undefined
}
// 结束追踪 清理依赖
export function endTrack(sub) {
    const depsTail = sub.depsTail
    if (depsTail) {
        if (depsTail.nextDep) {
            //   如果尾节点还有下一个节点，说明第二次effect执行时 有的ref尝试复用收集过的节点。复用失败了 此时这个失败的就是没被二次依赖收集的节点所以要清理
            clearTracking(depsTail.nextDep)
            depsTail.nextDep = undefined
        }
    } else if (sub.deps) {
        // 因为首次effect执行把尾结点弄为undefined了，如果二次执行时还是undefined说明依赖没收集到（所有的ref都没进if）
        // 所以没进if要把deps全部删掉 头节点是第一次收集的
        clearTracking(sub.deps)
        sub.deps = undefined
    }
}
//依赖清理：要删除dep收集依赖时的各个link节点 最后就是删除了dep的依赖 
export function clearTracking(link: Link) {
    while (link) {
        const { sub, prevSub, nextSub, nextDep, dep } = link
        // 如果上一个节点有，就把上一个节点的下一个指向要清理的下一个  场景 一个name被两个effect引入 第一个effect如果要清理 还要把后面的effect关系处理一下
        if (prevSub) {
            prevSub.nextSub = nextSub
            link.nextDep = undefined
        } else {
            // 没有上一个说明是头节点，把头结点指向要清理的下一个,这个依赖清理了 所以要断开dep ref中的subs关联当前节点
            dep.subs = nextSub
        }
        if (nextSub) {
            // 如果有下一个节点，把下一个节点的上一个指向要清理的上一个
            nextSub.prevSub = prevSub
            link.prevSub = undefined
        } else {
            // 没有下一个节点说明是尾节点，把尾节点指向要清理的上一个
            dep.subsTail = prevSub
        }
        // 节点清理了  所以把节点的dep和sub全删掉
        link.dep = link.sub = undefined
        // 把当前节点放到linkPool中，下次复用  linkPool就是废弃的link节点 赋值linkPool = link 赋值之前将link的nextDep指向当前的linkPool（第一次就是undefined）
        link.nextDep = linkPool
        linkPool = link
        console.log('不要了保存起来', linkPool);
        // 下一轮循环 继续清理
        link = nextDep
    }
}   