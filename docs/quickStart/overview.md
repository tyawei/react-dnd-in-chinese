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

## Connectors

backend 处理 DOM 事件，React Component 来描述 DOM，那么 backend 怎么知道究竟去监听哪个 DOM 节点？—— 通过 connectors。connectors 使得我们可以在 `render` 函数中指定预定义好的拖动源、拖动预览或是放置目标对应到 DOM 节点。

实际上，connector 是作为第一个参数被传递到我们以上所说的 collecting 函数中的。让我们看看如何使用它来指定放置目标：

```javascript
function collect(connect, monitor) {
  return {
    highlighted: monitor.canDrop(),
    hovered: monitor.isOver(),
    connectDropTarget: connect.dropTarget()
  }
}
```

于是在 component 的 `render` 方法中，我们可以访问到 monitor 中的数据以及 connector 中的函数：

```javascript
// ES6
render() {
  const { highlighted, hovered, connectDropTarget } = this.props

  return connectDropTarget(
    <div className={classSet({
      'Cell': true,
      'Cell--highlighted': highlighted,
      'Cell--hovered': hovered
    })}
    >
      {this.props.children}
    </div>
  )
}
```

`connectDropTarget` 函数的调用会告知 React DnD 我们组件的根 DOM 节点是一个有效的放置目标，进而它的移入和放置事件会被 backend 处理。在内部，它是通过为我们定义的 React 元素上附加回调引用（callback ref）来实现的。connector 返回的该函数是被缓存的，因此不会使 `shouldComponentUpdate` 的优化失效。

## Drag Sources and Drop Targets

目前为止，我们提到了结合 DOM 的 backend、代表 item 和 type 的数据、collecting 函数，以及用来描述 React DnD 该为我们的组件注入何种 props 的 monitor 和 connector。

我们如何配置我们的组件来实际拥有这些注入的 props？我们如何处理拖动和放置事件的副作用？我们把注意力集中到拖动源和放置目标上，他们是 React DnD 的主要抽象模块。他们与 type、item、副作用、collecting 函数紧密结合。

当我们想使得一个组件或它其中的某些部分是可拖拽的，我们需要将该组件包裹至拖拽源声明中。每个拖拽源都会注册一个确定的 type，并指定一个用来根据 component props 产生 item 的方法。另外也允许指定一些其他的处理拖放事件的方法。拖拽源声明同样允许我们为给定的 component 指定 collecting 函数。

放置目标同拖拽源非常类似，他们唯一的区别是，一个放置目标也许会一次性注册多个 item types，而不是去产生一个 item。

## Higher-Order Components and ES7 decorators

高阶组件本质上是一个函数，传入一个 React Component Class，返回一个新的 React Component Class。库中提供的外层包裹组件将会在它的 `render` 方法中渲染我们的组件，并且传递 props 和一些其他有用的行为。

在 React DnD 中，`DragSource` 和 `DropTarget`，以及其他一些暴露的顶层 API 函数，事实上他们都是高阶组件。是它们将拖放的魔法赋予了我们的组件。

需要注意的是使用它们需要进行两次函数调用，例如，以下是如何将 `YourComponent` 包裹至 `DragSource`：

```javascript
// ES6
import { DragSource } from 'react-dnd'

class YourComponent {
  /* ... */
}

export default DragSource(/* ... */)(YourComponent)
```

注意，在为第一个函数指定 `DragSource` 参数并进行调用后，还有第二个函数调用，用来最终传入我们的 class。这被称为柯里化或是偏函数。结合 ES7 修饰器语法我们可以开箱即用：

```javascript
// ES7
import { DragSource } from 'react-dnd'

@DragSource(/* ... */)
export default class YourComponent {
  /* ... */
}
```

没必要一定用这种语法，但如果我们喜欢这种方式的话，可以通过 Babel 将我们的代码转译，在 `.babelrc` 文件中设置 `{ "stage": 1 }`。

即便我们没有计划使用 ES7，偏函数用法依然奏效，我们可以使用 ES5 或 ES6 标准并结合函数式组合辅助函数（比如 _.flow）来结合 `DragSource` 和 `DropTarget`。

```javascript
// ES6
import { DragSource, DropTarget } from 'react-dnd'
import flow from 'lodash/flow'

class YourComponent {
  render() {
    const { connectDragSource, connectDropTarget } = this.props
    return connectDragSource(connectDropTarget(
      /* ... */
    ))
  }
}

export default flow(
  DragSource(/* ... */),
  DropTarget(/* ... */)
)(YourComponent)
```

## Putting It All Together

以下是包裹 `Card` 组件至拖拽源的完整示例

```javascript
// ES6
import React from 'react'
import { DragSource } from 'react-dnd'

// Drag sources and drop targets only interact if they have the same string type.
// You want to keep types in a separate file with the rest of your app's constants.
const Types = {
  CARD: 'card'
}

/**
 * Specifies the drag source contract.
 * Only `beginDrag` function is required.
 */
const cardSource = {
  beginDrag(props) {
    // Return the data describing the dragged item
    const item = { id: props.id }
    return item
  },
  endDrag(props, monitor, component) {
    if (!monitor.didDrop()) {
      return
    }
    // When dropped on a compatible target, do something
    const item = monitor.getItem()
    const dropResult = monitor.getDropResult()
    CardActions.moveCardToList(item.id, dropResult.listId)
  }
}

/**
 * Specifies which props to inject into your component.
 */
function collect(connect, monitor) {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDragSource: connect.dragSource(),
    // You can ask the monitor about the current drag state:
    isDragging: monitor.idDragging()
  }
}

class Card extends React.Component {
  render() {
    // Your component receives its own props as usual
    const { id } = this.props

    // These two props are injected by React DnD,
    // as defined by your `collect` function above:
    const { isDragging, connectDragSource } = this.props

    return connectDragSource(
      <div>
        I am a draggable card number {id}
        { isDragging && ' (and I am being dragged now)' }
      </div>
    )
  }
}

// Export the wrapped version
export default DragSource(Types.CARD, cardSource, collect)(Card)
```
