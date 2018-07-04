import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as itemTypes from './constants'
import { DragSource } from 'react-dnd'
import { knightPreviewSrc } from './img'

const knightSource = {
  beginDrag(props) {
    return {}
  }
}

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  }
}

class Knight extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDragPreview: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired
  }

  componentDidMount() {
    const { connectDragPreview } = this.props

    const img = new Image()
    img.src = knightPreviewSrc
    img.onload = () => {
      connectDragPreview(img)
    }
  }

  render() {
    const { connectDragSource, isDragging } = this.props
    return connectDragSource(
      <span style={{
        opacity: isDragging ? 0.5 : 1,
        fontSize: '30px',
        fontWeight: 'bold',
        cursor: 'move'
      }}>
        ♘
      </span>
    )
  }
}

export default DragSource(itemTypes.KNIGHT, knightSource, collect)(Knight)
