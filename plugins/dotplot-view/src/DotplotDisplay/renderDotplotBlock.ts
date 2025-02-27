import clone from 'clone'
import { readConfObject } from '@jbrowse/core/configuration'
import { getRpcSessionId } from '@jbrowse/core/util/tracks'
import { getSnapshot, IAnyStateTreeNode } from 'mobx-state-tree'
import { getContainingView, getSession } from '@jbrowse/core/util'

import { DotplotViewModel } from '../DotplotView/model'

export function renderBlockData(self: IAnyStateTreeNode) {
  const { rpcManager } = getSession(self)
  const { rendererType } = self
  const { adapterConfig } = self
  const parent = getContainingView(self) as DotplotViewModel

  // Alternative to readConfObject(config) is below used because renderProps is
  // something under our control.  Compare to serverSideRenderedBlock
  readConfObject(self.configuration)
  getSnapshot(parent)

  if (parent.initialized) {
    const { viewWidth, viewHeight, borderSize, borderX, borderY } = parent
    return {
      rendererType,
      rpcManager,
      renderProps: {
        ...self.renderProps(),
        view: clone(getSnapshot(parent)),
        width: viewWidth,
        height: viewHeight,
        borderSize,
        borderX,
        borderY,
        adapterConfig,
        rendererType: rendererType.name,
        sessionId: getRpcSessionId(self),
        timeout: 1000000, // 10000,
      },
    }
  }
  return undefined
}

export async function renderBlockEffect(
  props?: ReturnType<typeof renderBlockData>,
) {
  if (!props) {
    throw new Error('cannot render with no props')
  }

  const { rendererType, rpcManager, renderProps } = props
  try {
    const { reactElement, ...data } = await rendererType.renderInClient(
      rpcManager,
      renderProps,
    )
    return {
      reactElement,
      data,
      renderingComponent: rendererType.ReactComponent,
    }
  } catch (e) {
    console.error('hello', e)
    throw e
  }
}
