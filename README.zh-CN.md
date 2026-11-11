# 大语言模型是怎么来的

[English](README.md) · **简体中文** · [العربية](README.ar.md)

**[在浏览器里直接玩 →](https://thesybuilder.github.io/how-llms-happened/zh/)**

### 从数字母开始，怎么就变成了能和你聊天的机器？

LLM Lineage 用 32 个浏览器小游戏讲大语言模型的历史：从 1913 年马尔可夫数普希金诗里的元音，一直讲到 2026 年的智能体。每个游戏都基于一篇真实的论文，都有一个目标，玩完还能拿到一张可以分享的成绩卡。

**32 个小游戏 · 1913 → 2026 · 不需要机器学习基础 · English、简体中文、العربية**

![首页：标题旁边是“你比 GPT-2 聪明吗？”挑战，下面是按时代排开的时间线](docs/images/home.png)

## 先来个挑战

首页一打开就是 **你比 GPT-2 聪明吗？** 一共十句话，每句从四个选项里挑出真正的下一个词，要赶在计时结束前选好。GPT-2 small 的答案是用真正的 1.24 亿参数模型提前录好的，所以你对手就是它当时真实的选择。页面上没有任何模型在实时运行。

接着从时间线里挑一个游戏。几个我们最喜欢的：

| 游戏 | 年份 | 讲的是什么 |
| --- | --- | --- |
| **你能做到随机吗？** 按 A 或 B 三十次，看一个 1913 年的计数小把戏能不能猜中你。 | 1913 | 马尔可夫链 |
| **拆穿 ELIZA。** 抓住第一个聊天机器人的三种破绽。 | 1966 | 模式匹配和 ELIZA 效应 |
| **最近的词。** 每日谜题：靠真实词向量的接近度找出秘密词。 | 2013 | 词嵌入 |
| **你的名字值几个词元？** 随便输入点什么，看真实的 GPT-2 词元一个个冒出来。 | 2016 | 字节对编码（BPE） |
| **注意力谜题。** 用尽量少的步数，决定一个词去“听”哪些词。 | 2017 | Transformer |
| **训练一个评判员。** 教出一个奖励模型，再看它给一句自信的假话打出和真话一样高的分。 | 2022 | 从人类反馈中学习 |
| **我的笔记本跑得动吗？** 找出你的内存装得下的最大开放模型。 | 2023 | 开放权重和量化 |
| **凑出目标数。** 先解几道数字谜题，再看推理模型探索出来的搜索树。 | 2024 | 靠搜索来推理 |

每一章都从它的游戏开始。**故事** 讲当时的问题、想出来的办法，以及它改变了什么。**数学与资料** 里有公式和原始论文的链接。

![玩完一局“你能做到随机吗？”：成绩卡上写着“It predicted you 50% of the time.”，下面有分享到 X、复制链接、保存图片和再玩一次的按钮](docs/images/result-card.png)

<details>
<summary><strong>这些游戏有多“真”？</strong></summary>

<br />

这些游戏是小型教学模型，专门让一种机制看得见。大多数只从很小的数据集里学习，或者用手写的规则，每个游戏下面都有一行字说明这一点。凡是用到真实模型数据的地方，数据都是真的：

- **GPT-2 挑战：** GPT-2 small（1.24 亿参数）给出的下一个词概率，2026 年 11 月 11 日用 transformers.js 录制（[`scripts/record-gpt2.mjs`](scripts/record-gpt2.mjs)）。
- **词元：** GPT-2 的字节级 BPE 词表和合并规则，和参考分词器对照检查过。
- **最近的词：** GloVe 6B 50 维词向量，截取了大约 5,000 个常用词。
- **我的笔记本跑得动吗？：** 参数量来自每个模型的官方说明卡。

</details>

## 在自己电脑上运行

需要 **Node.js 22.12+** 和 **npm 9.6.5+**。

```sh
git clone https://github.com/TheSyBuilder/how-llms-happened.git
cd how-llms-happened
npm install
npm run dev
```

网站支持浅色和深色模式，最窄能在 320 px 宽的手机上用，触屏、鼠标、键盘都能操作。阿拉伯语页面是从右到左排版的。

<details>
<summary><strong>在手机上</strong></summary>

<br />
<img src="docs/images/home-mobile.png" width="320" alt="手机上的首页（深色模式）：先是标题，下面是 GPT-2 挑战和四个答案按钮" />

</details>

<details>
<summary><strong>给贡献者：代码和检查</strong></summary>

用 **Astro + Preact** 搭建。设计规范和游戏组件约定写在 [`docs/launch-redesign.md`](docs/launch-redesign.md)。

| 想找…… | 从这里看起 |
| --- | --- |
| 章节顺序、年份和时代 | [`src/lib/chapter-meta.ts`](src/lib/chapter-meta.ts)、[`src/lib/chapters.ts`](src/lib/chapters.ts) |
| 游戏名称和第一步提示 | [`src/lib/first-steps.ts`](src/lib/first-steps.ts) |
| 共用的目标栏、成绩卡和进度 | [`src/components/game/`](src/components/game/)、[`src/lib/progress.ts`](src/lib/progress.ts) |
| 游戏和故事 | [`src/components/`](src/components/) |
| 论文信息和链接 | [`data/corpus.json`](data/corpus.json)、[`src/lib/chapter-papers.ts`](src/lib/chapter-papers.ts) |
| 翻译 | [`src/i18n/`](src/i18n/) |

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run build` 还会给每一章生成一张 1200 × 630 的分享图（`/og/<slug>.png`），并检查链接、锚点和每个页面的体积预算。

</details>

## 致谢

数据：GPT-2 权重和分词器文件来自 OpenAI（MIT 许可证）；GloVe 词向量来自 Pennington、Socher 和 Manning（Public Domain Dedication and License）；ENABLE 词表（公有领域）。字体：Space Grotesk 和 DM Sans（SIL Open Font License）。每一章都附有它所依据的论文链接。

## 帮下一个人看懂

有哪个瞬间让你一下子明白了某个想法，或者哪个游戏把你搞糊涂了？[开一个 issue](https://github.com/TheSyBuilder/how-llms-happened/issues)，写上是哪一章、你试了什么。欢迎附上原始出处来纠错。

如果你玩得开心，点个 **Star**，能让更多好奇的人找到它。
