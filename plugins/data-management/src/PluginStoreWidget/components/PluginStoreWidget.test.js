import React from 'react'
import { getSnapshot, getParent } from 'mobx-state-tree'
import { ThemeProvider } from '@mui/material/styles'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { createJBrowseTheme } from '@jbrowse/core/ui'
import { createTestSession } from '@jbrowse/web/src/rootModel'

import PluginStoreWidget from './PluginStoreWidget'
jest.mock('@jbrowse/web/src/makeWorkerInstance', () => () => {})

const plugins = {
  plugins: [
    {
      name: 'MsaView',
      authors: ['Colin Diesh'],
      description: 'multiple sequence alignment browser plugin for JBrowse 2',
      location: 'https://github.com/GMOD/jbrowse-plugin-msaview',
      url: 'https://unpkg.com/jbrowse-plugin-msaview/dist/jbrowse-plugin-msaview.umd.production.min.js',
      license: 'Apache License 2.0',
      image:
        'https://raw.githubusercontent.com/GMOD/jbrowse-plugin-list/main/img/msaview-screenshot-fs8.png',
    },
  ],
}

describe('<PluginStoreWidget />', () => {
  let session
  let model

  beforeEach(() => {
    session = createTestSession()
    model = session.addWidget('PluginStoreWidget', 'pluginStoreWidget')
    const { location } = window
    delete window.location
    window.location = {
      ...location,
      reload: jest.fn(),
    }
    fetch.resetMocks()
    fetch.mockResponse(JSON.stringify(plugins))
  })

  afterEach(cleanup)

  it('renders with the available plugins', async () => {
    const { container, findByText } = render(
      <ThemeProvider theme={createJBrowseTheme()}>
        <PluginStoreWidget model={model} />
      </ThemeProvider>,
    )
    await findByText('multiple sequence alignment browser plugin for JBrowse 2')
    expect(container.firstChild).toMatchSnapshot()
  })

  it('Installs a session plugin', async () => {
    const { findByText } = render(
      <ThemeProvider theme={createJBrowseTheme()}>
        <PluginStoreWidget model={model} />
      </ThemeProvider>,
    )
    await findByText('multiple sequence alignment browser plugin for JBrowse 2')
    fireEvent.click(await findByText('Install'))
    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled()
    })
    expect(getSnapshot(session.sessionPlugins)[0]).toEqual(plugins.plugins[0])
  })

  it('plugin store admin - adds a custom plugin correctly', async () => {
    session = createTestSession({}, true)
    model = session.addWidget('PluginStoreWidget', 'pluginStoreWidget')
    const { findByText, getByText, getByLabelText } = render(
      <ThemeProvider theme={createJBrowseTheme()}>
        <PluginStoreWidget model={model} />
      </ThemeProvider>,
    )
    await findByText('multiple sequence alignment browser plugin for JBrowse 2')
    fireEvent.click(getByText('Add custom plugin'))
    fireEvent.change(getByLabelText('Plugin URL'), {
      target: {
        value:
          'https://unpkg.com/jbrowse-plugin-msaview/dist/jbrowse-plugin-msaview.esm.js',
      },
    })
    fireEvent.change(getByLabelText('Plugin name'), {
      target: {
        value: 'MsaView',
      },
    })
    fireEvent.click(getByText('Submit'))

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled()
    })

    expect(getSnapshot(getParent(session)).jbrowse.plugins).toEqual([
      {
        name: 'MsaView',
        umdUrl:
          'https://unpkg.com/jbrowse-plugin-msaview/dist/jbrowse-plugin-msaview.esm.js',
      },
    ])
  })

  it('plugin store admin - removes a custom plugin correctly', async () => {
    session = createTestSession({}, true)
    model = session.addWidget('PluginStoreWidget', 'pluginStoreWidget')
    const rootModel = getParent(session)
    const { jbrowse } = rootModel
    jbrowse.addPlugin(plugins.plugins[0])
    const { findByText, getByText, getByTestId } = render(
      <ThemeProvider theme={createJBrowseTheme()}>
        <PluginStoreWidget model={model} />
      </ThemeProvider>,
    )
    await findByText('multiple sequence alignment browser plugin for JBrowse 2')
    fireEvent.click(getByTestId('removePlugin-SVGPlugin'))
    fireEvent.click(getByText('Confirm'))
    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled()
    })
  })
})
