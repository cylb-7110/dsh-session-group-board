# 会话分组（dsh-session-group-board）

> **English:** a standalone session-group board for DeepSeek Harness. It adds seats beside the
> shipped sidebar instead of replacing it: a horizontal group board (5 cards × 2 rows per page,
> with a pager), a group colour dot on each session row, the group name in the row hover card,
> and an “Assign group…” session-menu action. Pins are the same registry-global pins the sidebar
> drives; each group lists its pinned cards first, most recently pinned first. Group membership
> lives in this browser's localStorage. The sections below are in Chinese.

给 DeepSeek Harness 工作区里的会话加**自定义分组**，属于纯前端插件（不替换任何内置界面，只往既有位置加东西）。

## 怎么用

1. 左侧栏顶部会多出一行 **「会话分组」**（在「订阅管理」下面）。点它打开分组看板。
2. 点右上角 **「新建分组」** 建分组（颜色自动分配）。
3. 把会话卡片**拖到**目标分组行即可归组；拖回「未分组」行等于取消归组。
4. 分组标题上可以 **重命名 / 删除**（删除后该分组的会话回到未分组）。
5. 点击卡片直接打开该会话。

分组看板是**横版**布局：每个分组占一行，左侧是分组名、数量与「重命名 / 删除」，右侧的会话卡片按 **5 列 × 2 行**（每页 10 个）排列；超出的一页会折到下一页，行尾出现「‹ 第 1 / 3 页 ›」翻页条。整页上下滚动。

看板会**显示全部会话（含已归档）**：未归档会话的标题**加粗**突出显示；已归档的卡片变淡、标题常规字重、带「已归档」标记。点已归档卡片不会打开（和侧栏一致，会给出「取消归档后可打开」提示）；点「取消归档」后卡片**立刻**恢复正常、可以直接点击进入会话。

## 卡片动作（桥接侧栏同一套操作）

每张卡片悬停（触屏常显）后右下角有一排动作按钮，直接调用内置的会话/工作区服务：

| 按钮 | 作用 |
| --- | --- |
| 📌 置顶 / 取消置顶 | **和侧栏是同一个置顶**（`uiWorkspace.pinSession/unpinSession`）：两个入口点哪个都会触发置顶，状态互相可见。侧栏保持原规则显示（置顶的排前、按置顶先后）；会话分组里，置顶卡片排在本组最前，按置顶时间**从近到远**，取消置顶后组内立刻重排。置顶后自动回到第 1 页 |
| ✏️ 重命名 | `sessions.using(...).binding.session.rename(...)`，列表标题立即更新 |
| 🗄 归档 / 取消归档 | `uiWorkspace.archiveSession/unarchiveSession`；会话在运行时弹「停止并归档？」确认 |
| 🏷 归入分组 | 打开分组选择框，可当场新建 |

失败（权限、Host 拒绝等）会在看板标题下显示提示，不会静默。

小细节：归档**当前正在打开**的会话时，内置逻辑会清空中间的主视图；插件会在归档成功后把看板切回自身，所以你不会被弹回会话页。

另外三个内置位置也会显示分组：

- 会话行左侧的空闲小格会出现**分组色点**（鼠标悬停有分组名）。
- 会话行的**悬停卡片**里显示分组名。
- 会话的 **「...」/ 右键菜单**里多一项 **「归入分组…」**，弹出分组选择框，可当场新建分组。

## 数据存在哪里

分组与归属存在**当前浏览器**的 `localStorage`，键名 `dsh.session-categories.v1`（沿用旧键名，改名不影响已有数据）。
置顶不是本地状态：它写进 Host 的全局置顶集合（和侧栏按钮同一份），因此侧栏与分组看板看到的是同一个「已置顶」状态。
因此：换浏览器、换端口源、清空站点数据后需要重新归组；分组不会上传到 Host，也不会写进会话日志。

## 安装 / 卸载

- **GitHub Release（发布方式）**：下载 [Releases](https://github.com/cylb-7110/dsh-session-group-board/releases) 里的 `.tgz`，然后

  ```bash
  dsh plugin --profile <profile> add https://github.com/cylb-7110/dsh-session-group-board/releases/download/v1.0.0/dsh-session-group-board-1.0.0.tgz
  ```

  或在插件页「添加插件」里填入该地址 / 选择下载后的 tgz。
- **本地目录（开发）**：用插件管理器的本地目录安装（会把本目录链接进 profile，改代码后刷新页面即生效）。
- **卸载**：插件页里移除对应 bundle；或由 DSH 插件管理器操作。
- 改动 `client.js` 后，页面刷新（Ctrl+R）才会加载新代码；不需要重启 DSH。
- 注意：Release 版与本地开发版是**两种安装**，不要同时装两个——它们注册相同的界面位置，会互相冲突。

## 已知限制

- 只在「分组看板」里按分组显示；内置的侧栏会话列表仍然按工作区分组，分组以色点/悬停/菜单的形式叠加显示。要变成侧栏里真正的分组，需要整体替换 `sidebar.workspaces`（搜索、置顶、归档、拖拽排序、工作区对话框都要重写），这是另一个量级的改动。
- 看板显示全部非子代理、非空白新会话的会话（含已归档）；已归档会话不能直接打开，与侧栏行为一致。
- 分组固定 5 列 × 2 行，中间栏很窄时卡片会比较紧凑。
- 界面文案按浏览器语言在中文/英文之间切换（`zh*` 用中文）。

## 文件

| 文件 | 作用 |
| --- | --- |
| `client.js` | 全部界面：分组看板（横版分页）、色点、悬停卡片、菜单项、分组弹窗 |
| `index.js` | Host 半：空的 `apply()`，只为让 bundle 有一行插件记录 |
| `cordis.patch.yml` | 插入 `session-categories` 行 |
| `locale/zh.json`、`locale/en.json` | 插件页面显示用的标题/描述/详情路径 |
| `icon.svg` | 插件图标 |
| `docs/DETAIL*.md`、`docs/preview.svg` | 插件详情页插图 |
