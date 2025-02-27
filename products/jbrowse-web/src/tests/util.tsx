import React from 'react'
import { clearCache } from '@jbrowse/core/util/io/RemoteFileWithRangeCache'
import { clearAdapterCache } from '@jbrowse/core/data_adapters/dataAdapterCache'
// eslint-disable-next-line import/no-extraneous-dependencies
import { render } from '@testing-library/react'

// eslint-disable-next-line import/no-extraneous-dependencies
import { toMatchImageSnapshot } from 'jest-image-snapshot'

// eslint-disable-next-line import/no-extraneous-dependencies
import { LocalFile, GenericFilehandle } from 'generic-filehandle'

// eslint-disable-next-line import/no-extraneous-dependencies
import rangeParser from 'range-parser'
import PluginManager from '@jbrowse/core/PluginManager'
import { QueryParamProvider } from 'use-query-params'

import JBrowseWithoutQueryParamProvider from '../JBrowse'
import JBrowseRootModelFactory from '../rootModel'
import configSnapshot from '../../test_data/volvox/config.json'
import corePlugins from '../corePlugins'

// eslint-disable-next-line import/no-extraneous-dependencies
import { Image, createCanvas } from 'canvas'

import { LinearGenomeViewModel } from '@jbrowse/plugin-linear-genome-view'
import { WindowHistoryAdapter } from 'use-query-params/adapters/window'

type LGV = LinearGenomeViewModel

jest.mock('../makeWorkerInstance', () => () => {})

// @ts-ignore
global.nodeImage = Image
// @ts-ignore
global.nodeCreateCanvas = createCanvas

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPluginManager(initialState?: any, adminMode = true) {
  const pluginManager = new PluginManager(corePlugins.map(P => new P()))
  pluginManager.createPluggableElements()

  const JBrowseRootModel = JBrowseRootModelFactory(pluginManager, adminMode)
  const rootModel = JBrowseRootModel.create(
    {
      jbrowse: initialState || configSnapshot,
      assemblyManager: {},
    },
    { pluginManager },
  )
  // @ts-ignore
  if (rootModel && rootModel.jbrowse.defaultSession.length) {
    const { name } = rootModel.jbrowse.defaultSession
    localStorage.setItem(
      `localSaved-1`,
      JSON.stringify({ session: rootModel.jbrowse.defaultSession }),
    )
    rootModel.activateSession(name)
  } else {
    rootModel.setDefaultSession()
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  rootModel.session!.views.map(view => view.setWidth(800))
  pluginManager.setRootModel(rootModel)

  pluginManager.configure()
  return pluginManager
}

export function generateReadBuffer(
  getFileFunction: (str: string) => GenericFilehandle,
) {
  return async (request: Request) => {
    try {
      const file = getFileFunction(request.url)
      const maxRangeRequest = 10000000 // kind of arbitrary, part of the rangeParser
      const r = request.headers.get('range')
      if (r) {
        const range = rangeParser(maxRangeRequest, r)
        if (range === -2 || range === -1) {
          throw new Error(`Error parsing range "${r}"`)
        }
        const { start, end } = range[0]
        const len = end - start + 1
        const buf = Buffer.alloc(len)
        const { bytesRead } = await file.read(buf, 0, len, start)
        const stat = await file.stat()
        return new Response(buf.slice(0, bytesRead), {
          status: 206,
          headers: [['content-range', `${start}-${end}/${stat.size}`]],
        })
      }
      const body = await file.readFile()
      return new Response(body, { status: 200 })
    } catch (e) {
      console.error(e)
      return new Response(undefined, { status: 404 })
    }
  }
}

export function setup() {
  window.requestIdleCallback = (cb: Function) => cb()
  window.cancelIdleCallback = () => {}
  window.requestAnimationFrame = (cb: Function) => setTimeout(cb)
  window.cancelAnimationFrame = () => {}

  Storage.prototype.getItem = jest.fn(() => null)
  Storage.prototype.setItem = jest.fn()
  Storage.prototype.removeItem = jest.fn()
  Storage.prototype.clear = jest.fn()

  expect.extend({ toMatchImageSnapshot })
}

// eslint-disable-next-line no-global-assign
window = Object.assign(window, { innerWidth: 800 })

export function canvasToBuffer(canvas: HTMLCanvasElement) {
  return Buffer.from(
    canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ''),
    'base64',
  )
}

export function expectCanvasMatch(
  canvas: HTMLElement,
  failureThreshold = 0.05,
) {
  expect(canvasToBuffer(canvas as HTMLCanvasElement)).toMatchImageSnapshot({
    failureThreshold,
    failureThresholdType: 'percent',
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function JBrowse(props: any) {
  return (
    <QueryParamProvider adapter={WindowHistoryAdapter}>
      <JBrowseWithoutQueryParamProvider {...props} />
    </QueryParamProvider>
  )
}

export const hts = (str: string) => 'htsTrackEntry-' + str
export const pc = (str: string) => `prerendered_canvas_${str}_done`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createView(args?: any, adminMode?: boolean) {
  const pluginManager = getPluginManager(args, adminMode)
  const rest = render(<JBrowse pluginManager={pluginManager} />)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rootModel = pluginManager.rootModel!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const session = rootModel.session!

  const view = session.views[0] as LGV
  return { view, rootModel, session, ...rest }
}

export function doBeforeEach(
  cb = (str: string) => require.resolve(`../../test_data/volvox/${str}`),
) {
  clearCache()
  clearAdapterCache()

  // @ts-ignore
  fetch.resetMocks()
  // @ts-ignore
  fetch.mockResponse(generateReadBuffer(url => new LocalFile(cb(url))))
}
