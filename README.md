# Liang Ping | 日常回响

季度新品互动展览。在线版由 GitHub Pages 发布，根目录的 `index.html` 内含展示所需图片，`media/` 保存按需加载的配乐。

## 更新网页

可编辑源码、图片和详细说明位于 `source/`。安装 Node.js 24 或更高版本后，在 `source/` 目录运行：

```sh
npm ci
npm run dev
```

修改完成后，在 `source/` 目录重新生成网站：

```sh
npm run publish:build
npm test
npm run check
```

将更新后的 `source/`、根目录 `index.html` 和 `media/` 一起提交到 `main` 分支，GitHub Pages 会重新发布。`npm run offline -- "Liang Ping.html"` 可额外生成包含配乐的离线单文件。

## 本版体验

品牌统一为 Liang Ping；说明性段落保留在组件注释中，不进入页面。作品入口、悬停金属反光、章节横滑、原图归位转场、可拖动的观看进度和原图缩放共同构成展览。

首次选择作品时开始播放用户提供的《Someone In The Crowd》。音轨在切换作品时连续播放，手动暂停会保持；右下角可控制播放与音量。音乐按需加载，不阻塞首屏。

浏览器测试：启动网站后，在 `source/` 运行 `PREVIEW_URL=http://127.0.0.1:3197/ npm run test:browser` 和 `npm run test:quiet`。测试覆盖桌面、手机、减少动态设置、图片、转场、触控、音轨和原图查看。

本项目采用 AI Website Cloner Template 的开源代码；模板许可证保留在 `source/LICENSE`。珠宝图片和配乐由项目作者提供，不随模板许可证授权。Cartier 为参考网站，本项目不隶属于 Cartier。
