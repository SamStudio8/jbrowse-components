/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactPropTypes from 'prop-types'
import React, { useState, useRef, useEffect } from 'react'
import { drawImageOntoCanvasContext } from '../util/offscreenCanvasPonyfill'

function PrerenderedCanvas(props: {
  width: number
  height: number
  highResolutionScaling: number
  style: any
  imageData: any
  showSoftClip?: boolean
  blockKey?: string
}) {
  const {
    width,
    height,
    highResolutionScaling,
    style,
    imageData,
    blockKey,
    showSoftClip,
  } = props
  const [done, setDone] = useState(false)

  const featureCanvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!imageData) {
      return
    }
    const canvas = featureCanvas.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }
    drawImageOntoCanvasContext(imageData, context)
    setDone(true)
  }, [imageData])

  const softClipString = showSoftClip ? '_softclipped' : ''
  const blockKeyStr = blockKey ? '_' + blockKey : ''
  const testId = `prerendered_canvas${softClipString}${blockKeyStr}${
    done ? '_done' : ''
  }`
  return (
    <canvas
      data-testid={testId}
      ref={featureCanvas}
      width={width * highResolutionScaling}
      height={height * highResolutionScaling}
      style={{ width, height, ...style }}
    />
  )
}

PrerenderedCanvas.propTypes = {
  height: ReactPropTypes.number.isRequired,
  width: ReactPropTypes.number.isRequired,
  highResolutionScaling: ReactPropTypes.number,
  style: ReactPropTypes.objectOf(ReactPropTypes.any),
  imageData: ReactPropTypes.any,
  // config: ReactPropTypes.objectOf(ReactPropTypes.any),
}
PrerenderedCanvas.defaultProps = {
  imageData: undefined,
  highResolutionScaling: 1,
  style: {},
  // config: {},
}

export default PrerenderedCanvas
