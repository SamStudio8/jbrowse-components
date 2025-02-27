import React, { useRef } from 'react'
import { observer } from 'mobx-react'
import { getEnv } from 'mobx-state-tree'
import { makeStyles } from 'tss-react/mui'

// locals
import { BreakpointViewModel } from '../model'
import AlignmentConnections from './AlignmentConnections'
import Breakends from './Breakends'
import Header from './Header'
import Translocations from './Translocations'

const useStyles = makeStyles()(theme => ({
  root: {
    position: 'relative',
    marginBottom: theme.spacing(1),
    overflow: 'hidden',
  },
  breakpointMarker: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 3,
    background: 'magenta',
  },
  viewDivider: {
    background: theme.palette.secondary.main,
    height: 3,
  },
  container: {
    display: 'grid',
  },
  overlay: {
    display: 'flex',
    width: '100%',
    gridArea: '1/1',
    '& path': {
      cursor: 'crosshair',
      fill: 'none',
    },
  },
  content: {
    gridArea: '1/1',
  },
}))

const Overlay = observer(
  (props: {
    parentRef: React.RefObject<SVGSVGElement>
    model: BreakpointViewModel
    trackId: string
  }) => {
    const { model, trackId } = props
    const tracks = model.getMatchedTracks(trackId)
    if (
      tracks[0]?.type === 'PileupTrack' ||
      tracks[0]?.type === 'AlignmentsTrack'
    ) {
      return <AlignmentConnections {...props} />
    }
    if (tracks[0]?.type === 'VariantTrack') {
      return model.hasTranslocations(trackId) ? (
        <Translocations {...props} />
      ) : (
        <Breakends {...props} />
      )
    }
    return null
  },
)

const BreakpointSplitView = observer(
  ({ model }: { model: BreakpointViewModel }) => {
    const { classes } = useStyles()
    const { views } = model
    const { pluginManager } = getEnv(model)
    const ref = useRef(null)

    return (
      <div>
        <Header model={model} />
        <div className={classes.container}>
          <div className={classes.content}>
            <div style={{ position: 'relative' }}>
              {views.map((view, idx) => {
                const { ReactComponent } = pluginManager.getViewType(view.type)
                const viewComponent = (
                  <ReactComponent key={view.id} model={view} />
                )
                if (idx === views.length - 1) {
                  return viewComponent
                }
                return [
                  viewComponent,
                  <div
                    key={`${view.id}-divider`}
                    className={classes.viewDivider}
                  />,
                ]
              })}
            </div>
          </div>
          <div className={classes.overlay}>
            <svg
              ref={ref}
              style={{
                width: '100%',
                zIndex: 10,
                pointerEvents: model.interactToggled ? undefined : 'none',
              }}
            >
              {model.matchedTracks.map(track => {
                // note: we must pass ref down, because the child component
                // needs to getBoundingClientRect on the this components SVG,
                // and we cannot rely on using getBoundingClientRect in this
                // component to make sure this works because if it gets
                // shifted around by another element, this will not re-render
                // necessarily
                return (
                  <Overlay
                    parentRef={ref}
                    key={track.configuration.trackId}
                    model={model}
                    trackId={track.configuration.trackId}
                  />
                )
              })}
            </svg>
          </div>
        </div>
      </div>
    )
  },
)

export default BreakpointSplitView
