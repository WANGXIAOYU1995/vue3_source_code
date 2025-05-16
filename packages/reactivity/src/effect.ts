import { Link } from "./system"

export let activeSub

class ReactiveEffect {
    constructor(public fn) {

    }
    // 依赖项列表的头节点
    deps: Link | undefined
    // 依赖项列表的尾节点
    depsTail: Link | undefined

    run() {
        // 先将之前的effect保存起来  没有嵌套时候就是undefined,因为js是单线程的 所以只有一个activeSub  上下两个effect也不影响
        const prevSub = activeSub
        activeSub = this
        this.depsTail = undefined
        try {
            return this.fn()
        } finally {
            endTrack(this)
            // if (this.depsTail) {
            //     console.log('清理', this.depsTail.nextDep);
            // }
            // 恢复之前的effect
            activeSub = prevSub
        }
    }
    // 依赖的数据发生了变化 会调用notify
    notify() {
        this.scheduler()
    }
    // scheduler 有可能会被外部传入的options覆盖
    scheduler() {
        // 在scheduler中执行run方法
        this.run()
    }
}

function endTrack(sub) {
    const depsTail = sub.depsTail
    if (depsTail) {
        if (depsTail.nextDep) {
            console.log('如果尾节点还有下一个节点，说明第二次effect执行时 有的ref尝试复用收集过的节点。复用失败了 此时这个失败的就是没被二次依赖收集的节点所以要清理');
            clearTracking(depsTail.nextDep)
            depsTail.nextDep = undefined
        }
    } else if (sub.deps) {
        // 因为首次effect执行把尾结点弄为undefined了，如果二次执行时还是undefined说明依赖没收集到（所有的ref都没进if）
        // 所以没进if要把deps全部删掉
        clearTracking(sub.deps)
        sub.deps = undefined
    }
}
function clearTracking(link: Link) {
    while (link) {
        const { sub, prevSub, nextSub, nextDep, dep } = link
        // 如果上一个节点有，就把上一个节点的下一个指向要清理的下一个  场景 一个name被两个effect引入 第一个effect如果要清理 还要把后面的effect关系处理一下
        if (prevSub) {
            prevSub.nextSub = nextSub
            link.nextDep = undefined
        } else {
            // 没有上一个说明是头节点，把头结点指向要清理的下一个
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
        link.nextDep = undefined
        // 下一轮循环 继续清理
        link = nextDep
    }
}
export function effect(fn, options) {
    const e = new ReactiveEffect(fn)
    Object.assign(e, options)
    e.run()
    // const runner = () => e.run()
    const runner = e.run.bind(e)  //官方写法 bind也创建了一个函数 同上述写法
    runner.effect = e
    // 为了保障this 要返回一个函数   同时给函数加个属性 effect
    return runner
}