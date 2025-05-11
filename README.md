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
