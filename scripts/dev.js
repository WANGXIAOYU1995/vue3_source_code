//monorepo  配置esbuild
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import esbuild from "esbuild";
import { createRequire } from "node:module";
// 打包开发环境
/** 解析命令行参数 */
const {
  values: { format },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    format: {
      type: "string",
      default: "esm",
      short: "f",
    },
  },
});
// 创建esm的__filename 和__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 配置打包的目录 包名
const target = positionals.length ? positionals[0] : "vue";
// 此处直接使用__dirname会报错，因为__dirname是commonjs的语法 所以这里需要自己获取一下
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
);
const require = createRequire(import.meta.url);
// 取package.json文件中的全局变量名使用
const pkg = require(`../packages/${target}/package.json`);
// esbuild配置
esbuild
  .context({
    entryPoints: [entry],
    outfile, // 打包后的输出目录
    format, // 打包后的格式 cjs esm iife
    platform: format === "cjs" ? "node" : "browser", // 打包后的平台 node browser
    sourcemap: true, // 生成sourcemap 方便调试
    bundle: true, // 把所有的依赖打包成一个文件
    globalName: pkg.buildOptions.name, // 打包后的全局变量名
  })
  .then((ctx) => {
    ctx.watch();
  });
