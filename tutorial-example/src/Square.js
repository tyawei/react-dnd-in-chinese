import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class Square extends Component {
  static propTypes = {
    black: PropTypes.bool
  }

  render() {
    const { black } = this.props
    const fill = black ? 'black' : 'white'
    const stroke = black ? 'white' : 'black'
    const wrapperStyle = {
      backgroundColor: fill,
      color: stroke,
      width: '100%',
      height: '100%'
    }

    return (
      <div style={wrapperStyle}>
        {this.props.children}
      </div>
    )
  }
}
