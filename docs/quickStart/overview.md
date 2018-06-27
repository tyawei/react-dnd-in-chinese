概览
===

React DnD 与大多数的拖放库不同，初次使用一定会令你大吃一惊。一旦品味了它的设计内涵，会发现一切是那么的言之有理。在实际阅读文档前，建议大家先阅读以下这些概念。

* 这些概念很多都与 Flux 和 Redux 类似
* 这不仅仅是巧合，因为 React DnD 内部也在使用 Redux

## Backends

React DnD 基于 H5 拖放 API 实现。默认基于它实现是有据可循的，因为它将被拖拽的 DOM 节点进行屏幕截取，并且脱离盒模型作为拖拽预览状态。当鼠标指针移动时我们不需要做额外的绘图渲染，这一点是十分方便的。另外该 API 也是唯一处理文件拖动事件的方法。

遗憾的是，H5 拖放 API 依然有很多缺陷。首先在触摸屏设备上它无法工作，另外在 IE 浏览器上它提供的可定制化程度明显低于其他浏览器。

这也是为什么在 React DnD 中 H5 拖放 API 以可拔插的插件方式提供。我们并非一定要使用它，我们可以基于触摸、鼠标等事件来编码不同的底层实现。在 React DnD 中这些可拔插的实现被称为 backends。目前仅有 HTML5 backend 收录于库中，未来会陆续添加进库。

backends 表现得同 React 合成事件系统十分相似：他们都抽象化了浏览器差异并统一处理了原生 DOM 事件。尽管如此，React DnD 并不依赖于 React 或它的合成事件系统。在底层实现上，backends 将 DOM 事件转换成了 React DnD 可以处理的内置 Redux Action。

## Items and Types

类似 Flux（或 Redux），React DnD 使用数据而不是视图作为事实来源。当我们横跨屏幕进行拖动操作时，我们不会描述说是一个组件或是 DOM 节点在被拖动，而是一个拥有确定类型的 item（an item of a certain type）正在被拖动。

什么是一个 item？一个 item 是一个用来描述什么正在被拖拽的纯 js 对象。例如，在一个看板应用中，当我们拖拽一个卡片，那么一个 item 可能是这样的：`{ cardId: 42 }`。在一个下棋游戏中，当我们拾起一个棋子，那么 item 可能是这样的：`{ fromCell: 'C5', piece: 'queen' }`。使用纯对象来描述拖拽数据有助于组件间解耦，它们之间并不关注各自的存在。

那么什么是 type？type 是字符串类型（或 Symbol 类型）用来唯一标识整个应用中 item 的类型。在一个看板应用中，我们可能使用 `card` type 来表示可拖拽卡片，并使用 `list` type 来表示承载这些卡片的可拖拽列表。在下棋游戏中可能使用 `piece` type。

Types 是十分有用的，随着应用的增长，越来越多的元素需要被设置为可拖放的。但是我们没必要让所有应用现存的放置目标（drop targets）立刻去适配新的 item。通过使用 type 我们可以指定哪些拖动源（drag sources）与哪些放置目标（drop targets）是对应的。同我们需要在应用中索引 Redux action type 类似，我们也需要去索引 ReactDnD 的 type。

## Monitors

拖放是内置存在状态的。无论是否正在进行拖动操作，或者当前是否存在 type 和 item，这些状态应该被实时存储在某处。

React DnD 通过包裹被称为 monitors 的内置数据存储机制的方式为我们的 component 暴露这些状态。monitors 使得我们的 component 以更新 props 的方式来响应拖放状态的变化。

对于需要跟踪拖放状态的每个组件，我们需要定义一个 collecting 函数来检索 monitors 中的相关拖放状态。React DnD 会及时地调用 collecting 函数并将返回值合并至 component 的 props 中。

比方说当一个棋子被拖动时我们要去高亮显示可放置的棋盘格子（Chess cells），那么对于 `Cell` 组件的 collecting 函数也许会是这样：

```javascript
function collect(monitor) {
  return {
    highlighted: monitor.canDrop(),
    hovered: monitor.isOver()
  }
}
```

这会令 React DnD 为所有的 `Cell` 组件实例的 props 传递最新的 `highlighted` 和 `hovered` 值。