学习进度：第三章 第4小节 响应式数据的伴侣 effect

# monorepo

使用pnpm，创建pnpm-workspace.yaml文件，配置monorepo  
monorepo 中 安装其他的包 pnpm install @vue/shared --workspace --filter @vue/reactivity 加workspace是安装本项目的包
"dependencies": {
"@vue/shared": "workspace:_"
} ^标识符代表 匹配的次要版本 _ 代表匹配所有的版本（源码中都是\*） ~代表匹配所有的修订 兄弟版本
