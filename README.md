# Liang Ping | 日常回响

季度新品互动展览。在线版由 GitHub Pages 发布，根目录的 `index.html` 是自包含的网页，包含展示所需图片。

## 更新网页

可编辑源码、图片和详细说明位于 `source/`。安装 Node.js 24 或更高版本后，在 `source/` 目录运行：

```sh
npm ci
npm run dev
```

修改完成后，在 `source/` 目录重新生成网站：

```sh
npm run offline -- ../index.html
npm test
npm run check
```

将更新后的 `source/` 和根目录 `index.html` 一起提交到 `main` 分支，GitHub Pages 会重新发布。

本项目采用 AI Website Cloner Template 的开源代码；模板许可证保留在 `source/LICENSE`。珠宝图片由项目作者提供，公开使用前请单独确认相应图片权利。Cartier 为参考网站，本项目不隶属于 Cartier。
