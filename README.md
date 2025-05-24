学习进度：第三章 第4小节 响应式数据的伴侣 effect

# monorepo

使用pnpm，创建pnpm-workspace.yaml文件，配置monorepo  
monorepo 中 安装其他的包 pnpm install @vue/shared --workspace --filter @vue/reactivity 加workspace是安装本项目的包
"dependencies": {
"@vue/shared": "workspace:_"
} ^标识符代表 匹配的次要版本 _ 代表匹配所有的版本（源码中都是\*） ~代表匹配所有的修订 兄弟版本

# 3.5 dep和sub双向关联和链表节点复用 笔记

```js
    <script type="module">
        import { effect, ref } from '../dist/reactivity.esm.js'
        const flag = ref(false)
        effect(() => {
            flag.value
            console.count('effect')
        })
        btn.onclick = () => {
            flag.value = !flag.value
        }
        /* 正确场景：点击一次触发一次effect
        bug:点击按钮，effect函数执行了两次，再次点击执行4次，原因是点击的时候执行了effect函数，里面又访问了flag 所以又进行了依赖收集
        effect  link1 link2  依赖收集了两次所以有两个link节点 此时两个link节点都指向同一个effect，所以执行了两次
        为了解决这个问题 需要将两个link节点进行公用，建一个deps尾指针（首次指向undefined）随后有公用节点时，移动尾指针到共用节点。最终目的是只执行一次effect（不管effect函数中有一个变量dep（点击造成多个依赖收集），还是多个变量dep（产生多个effect） effect都应该只执行一次）
        已知：我们在dep实例，ref中存放了subs subsTail 存放了effect实例 也就是每次单个dep（每个ref）所对应的 activeEffect链表（链表解决了effect嵌套关系）
        同时：需要在effect实例中维护一个deps depsTail 维护一个依赖链表，依赖链表存放的内容是每个link节点，l原有的link节点数据也要改造一下， 原先有sub nextSub preSub，sub原先存的是activeEffect，现在是 sub：deps depsTail  还要增加一个dep 指向 dep（ref的this），还有nextDep此时指向undefined
         */
    </script>
```

# 4.依赖清理

在effect中如果有分支依赖，也就是if时，不处理时 第一波effect执行会进行依赖收集，后续变化effect依然会执行（即使没进if）此时就需要清理依赖
首先改造需要在effect run函数中改造。run执行前调startTrack追踪，finally后endTrack 执行清理
什么时候需要清理呢？1.进了if，二次触发effect时未进行依赖收集，此时 复用节点时 会复用失败，因为二次effect执行 依赖收集 if没进的这里 会导致 直接创建新分支节点，新分支节点复用的时候发现复用不了第一次依赖收集存的deps 复用失败了 就把失败的这节点存起来作为当前复用完的下一个节点（由于尾结点一直指向newLink）.
所以当尾结点有且 尾节点有nextDep时就代表复用失败了，那这个复用失败的节点需要被清理 depsTail.nextDep 2.第二种情况 if是大条件，effect首次执行 if为true 第二次执行时 尾结点是undefined同时头结点有（第一次收集下的）此时也要清理全部dep.subs因为第二次执行没收集到依赖
清理依赖的函数:

# 5.reactive

坑1：创建同一个对象为代理对象要避免被重新代理 obj=P{a:1} reactive(obj) reactive(obj) 代理对象会重复创建不处理的话两者不===。用target和proxy存到WeakMap中，可以判断target是不是被代理过
坑2：reactive的参数是一个reactive代理对象，此时应该直接返回。首次创建代理对象时把proxy存到一个WeakSet中
坑3：ref如果传入一个对象，会被包装成reactive 在ref get和set中都进行对象判断如果是对象走reactive
坑4：如果给reactive二次赋值时给的值没有变化，不处理的话会二次赋值 执行effect。思路：在set方法中Reflect.set之前将target[key]存起来作为oldValue和传入的newValue做比较。可以用Object.is(oldValue,newValue),同理 ref也要做相应处理拿newValue和this.\_value对比。
坑5:如果把ref对象放到reactive中， 不需要.value可以直接拿。比如 const a = ref(0) const state=reactive(a) 此时state.a可以直接拿0。思路：在reactive的proxy get中判断值是不是isRef如果是Ref返回res.value
坑6：如果把ref对象放到reactive中 改state.a后没同步更改 a的ref值（官方会更改引用 ref的值），如果newValue是ref对象那就算了
思路：在reactive的set中判断如果oldValue是ref对象 并且newValue不是一个ref对象，则把oldValue.value（target[key]） = newValue
坑7:如果对象是嵌套的，不处理会失效 reactive(a:{b:1}) 改state.a.b 没有响应式 因为 a里面的对象没被reactive包裹 所以不是响应式。  
思路：在reactive的get中，如果取到的Reflect.get值是一个对象则返回一个被reactive包装的对象
