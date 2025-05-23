export let activeSub

class ReactiveEffect {
    constructor(public fn) {

    }
    run() {
        // 先将之前的effect保存起来  没有嵌套时候就是undefined,因为js是单线程的 所以只有一个activeSub  上下两个effect也不影响
        const prevSub = activeSub
        activeSub = this
        try {
            return this.fn()
        } finally {
            // 恢复之前的effect
            activeSub = prevSub
        }
    }
    notify() {
        this.scheduler()
    }
    // scheduler 有可能会被外部传入的options覆盖
    scheduler() {
        // 在scheduler中执行run方法
        this.run()
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