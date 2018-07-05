import React, { Component } from 'react'
import { DragDropContext } from 'react-dnd'
import _ from 'lodash'
import HTML5Backend from 'react-dnd-html5-backend'
import Card from './Card'

class App extends Component {
  state = {
    cards: [{
      id: 1,
      text: 'Write a cool JS library'
    }, {
      id: 2,
      text: 'Make it generic enough'
    }, {
      id: 3,
      text: 'Write README'
    }, {
      id: 4,
      text: 'Create some examples'
    }, {
      id: 5,
      text: 'Spam in Twitter and IRC to promote it (note that this element is taller than the others)'
    }, {
      id: 6,
      text: '???'
    }, {
      id: 7,
      text: 'PROFIT'
    }]
  }

  // 置换拖拽卡片和 hover 卡片
  moveCard = (dragIndex, hoverIndex) => {
    const { cards } = this.state
    const dragCard = cards[dragIndex]
    let cloneCards = _.cloneDeep(cards)

    cloneCards.splice(dragIndex, 1) // 删除拖拽卡片
    cloneCards.splice(hoverIndex, 0, dragCard) // 在 hover 卡片下方插入拖拽卡片
    this.setState({
      cards: cloneCards
    })
  }
  
  render() {
    const { cards } = this.state
    return (
      <div style={{ width: 400 }}>
        {
          cards.map((card, i) => (
            <Card
              key={card.id}
              index={i}
              id={card.id}
              text={card.text}
              moveCard={this.moveCard}
            />
          ))
        }
      </div>
    )
  }
}

export default DragDropContext(HTML5Backend)(App)
