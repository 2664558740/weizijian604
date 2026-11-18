# 魏子健 · 网页作品集

> 作者：魏子健｜学号：24002120604｜班级：电商24006
> 课程：高级网页设计（2026-2027-1）

## 在线地址

**作品集首页：** https://2664558740.github.io/weizijian604/

| 作品 | 地址 |
|---|---|
| 新闻排行榜选项卡 | https://2664558740.github.io/weizijian604/news-tab.html |
| 移动端手势卡片 | https://2664558740.github.io/weizijian604/mobile-gesture.html |

## 作品一：新闻排行榜选项卡

1:1 还原参考图（`images/reference-sina.png`）的新闻排行榜组件，四个选项卡：国内新闻（默认）、省内新闻、国际新闻、最热新闻。

**技术要点**

- 结构 / 样式 / 行为分离：HTML 只放结构，样式在 `css/`，脚本在 `js/` 且外部引入
- 命名规范：CSS 类名、id、JS 变量统一 `wzz_` 前缀（姓名首字母）
- 选项卡可复用：`wzz_initTabs(容器)` 传入任意带 `data-wzz-tabs` 的容器即可
- 切换逻辑：事件委托监听点击 → **先清除所有选项卡的选中状态** → **再设置当前元素的选中状态**

## 作品二：移动端手势卡片

四道中华美食，左右滑动切换，移动端触摸事件实践。

**技术要点**

- 监听 `touchstart` / `touchend` / `touchcancel`，用 `changedTouches[0]` 计算位移
- 阈值 40px 防误触；位移小于阈值判定为点击，不切换
- 边界提示：第一张/最后一张用红色高亮文字提示
- 300ms 冷却锁，防止快速连滑一次跳两张
- 卡片容器 `touch-action: pan-y`：只接管横向手势，纵向仍可滚动页面
- 0.3s 过渡动画；`user-select:none` + `-webkit-touch-callout:none` 去掉长按系统菜单

## 目录结构

```
.
├── AGENTS.md               # 项目编码规则（命名前缀 / 注释规范 / 提交规范）
├── index.html              # 作品集首页
├── news-tab.html           # 作品一：新闻排行榜选项卡
├── mobile-gesture.html     # 作品二：移动端手势卡片
├── css/
│   ├── style.css           # 作品一样式
│   └── mobile-gesture.css  # 作品二样式
├── js/
│   ├── tab.js              # 作品一逻辑
│   └── mobile-gesture.js   # 作品二逻辑
└── images/
    └── reference-sina.png  # 作品一参考图
```

## 本地运行

直接浏览器打开 `index.html` 即可；手机测试触摸时，在项目目录执行：

```bash
python -m http.server 8080
```

然后用手机访问 `http://电脑IP:8080/mobile-gesture.html`。

## 提交信息

- GitHub 仓库：`weizijian604`（姓名全拼 + 学号后三位）
- 提交人：魏子健 &lt;24002120604@neusoft.edu.cn&gt;
- 部署方式：GitHub Pages（main 分支根目录）
