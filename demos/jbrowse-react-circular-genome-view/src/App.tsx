import React, { useState, useEffect } from 'react'
import '@fontsource/roboto'
import {
  createViewState,
  JBrowseCircularGenomeView,
} from '@jbrowse/react-circular-genome-view'

import assembly from './assembly'
import tracks from './tracks'

const defaultSession = {
  name: 'My session',
  view: {
    id: 'circularView',
    type: 'CircularView',
    bpPerPx: 5000000,
    tracks: [
      {
        id: 'uPdLKHik1',
        type: 'VariantTrack',
        configuration: 'pacbio_sv_vcf',
        displays: [
          {
            id: 'v9QVAR3oaB',
            type: 'ChordVariantDisplay',
            configuration: 'pacbio_sv_vcf-ChordVariantDisplay',
          },
        ],
      },
    ],
  },
}

function View() {
  const [viewState, setViewState] =
    useState<ReturnType<typeof createViewState>>()
  const [patches, setPatches] = useState('')
  const [stateSnapshot, setStateSnapshot] = useState('')

  useEffect(() => {
    const state = createViewState({
      assembly,
      tracks,
      onChange: (patch: any) => {
        setPatches((previous) => previous + JSON.stringify(patch) + '\n')
      },
      defaultSession,
    })
    setViewState(state)
  }, [])

  if (!viewState) {
    return null
  }

  return (
    <>
      <h1>
        JBrowse 2 React Circular Genome View Demo (with create-react-app v4)
      </h1>
      <JBrowseCircularGenomeView viewState={viewState} />
      <h3>Code</h3>
      <p>
        The code for this app is available at{' '}
        <a
          href="https://github.com/GMOD/jbrowse-components/tree/main/demos/jbrowse-react-circular-genome-view"
          target="_blank"
          rel="noreferrer"
        >
          https://github.com/GMOD/jbrowse-components/tree/main/demos/jbrowse-react-circular-genome-view
        </a>
        .
      </p>
      <h3>Control the view</h3>
      <div>
        <p>
          This is an example of controlling the view from other elements on the
          page. Clicking on a button will rotate the view.
        </p>
        <button
          onClick={() => {
            viewState.session.view.rotateClockwise()
          }}
        >
          Rotate clockwise
        </button>
        <button
          onClick={() => {
            viewState.session.view.rotateCounterClockwise()
          }}
        >
          Rotate counter clockwise
        </button>
      </div>
      <h3>See the state</h3>
      <div>
        <p>
          The button below will show you the current session, which includes
          things like what region the view is showing and which tracks are open.
          This session JSON object can be used in the{' '}
          <code>defaultSession</code> of <code>createViewState</code>.
        </p>
        <button
          onClick={() => {
            setStateSnapshot(JSON.stringify(viewState.session, undefined, 2))
          }}
        >
          Show session
        </button>
      </div>
      <textarea value={stateSnapshot} readOnly rows={20} cols={80} />
      <h3>React to the view</h3>
      <p>
        Using <code>onChange</code> in <code>createViewState</code>, you can
        observe what is happening in the view and react to it. The changes in
        the state of the view are emitted as{' '}
        <a href="http://jsonpatch.com/" target="_blank" rel="noreferrer">
          JSON patches
        </a>
        . The patches for the component on this page are shown below.
      </p>
      <textarea value={patches} readOnly rows={5} cols={80} wrap="off" />
    </>
  )
}

export default View
