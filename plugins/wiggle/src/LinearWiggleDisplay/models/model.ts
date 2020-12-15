import {
  ConfigurationReference,
  getConf,
  readConfObject,
} from '@jbrowse/core/configuration'
import {
  isAbortException,
  getSession,
  getContainingView,
} from '@jbrowse/core/util'
import {
  getParentRenderProps,
  getRpcSessionId,
  getTrackAssemblyNames,
} from '@jbrowse/core/util/tracks'
import {
  BaseLinearDisplay,
  LinearGenomeViewModel,
} from '@jbrowse/plugin-linear-genome-view'
import { autorun, observable } from 'mobx'
import { addDisposer, isAlive, types, Instance } from 'mobx-state-tree'
import PluginManager from '@jbrowse/core/PluginManager'
import React from 'react'

import { AnyConfigurationSchemaType } from '@jbrowse/core/configuration/configurationSchema'
import { getNiceDomain } from '../../util'

import Tooltip from '../components/Tooltip'
import { FeatureStats } from '../../statsUtil'

// using a map because it preserves order
const rendererTypes = new Map([
  ['xyplot', 'XYPlotRenderer'],
  ['density', 'DensityRenderer'],
  ['line', 'LinePlotRenderer'],
])

function logb(x: number, y: number) {
  return Math.log(y) / Math.log(x)
}
function round(v: number, b = 1.5) {
  return (v >= 0 ? 1 : -1) * Math.pow(b, 1 + Math.floor(logb(b, Math.abs(v))))
}

type LGV = LinearGenomeViewModel

const stateModelFactory = (
  pluginManager: PluginManager,
  configSchema: AnyConfigurationSchemaType,
) =>
  types
    .compose(
      'LinearWiggleDisplay',
      BaseLinearDisplay,
      types.model({
        type: types.literal('LinearWiggleDisplay'),
        configuration: ConfigurationReference(configSchema),
        selectedRendering: types.optional(types.string, ''),
        resolution: types.optional(types.number, 1),
        fill: types.maybe(types.boolean),
        scale: types.maybe(types.string),
        autoscale: types.maybe(types.string),
      }),
    )
    .volatile(() => ({
      ready: false,
      message: undefined as undefined | string,
      stats: observable({ scoreMin: 0, scoreMax: 50 }),
      statsFetchInProgress: undefined as undefined | AbortController,
    }))
    .actions(self => ({
      updateStats(stats: { scoreMin: number; scoreMax: number }) {
        self.stats.scoreMin = stats.scoreMin
        self.stats.scoreMax = stats.scoreMax
        self.ready = true
      },

      setLoading(aborter: AbortController) {
        const { statsFetchInProgress: statsFetch } = self
        if (statsFetch !== undefined && !statsFetch.signal.aborted) {
          statsFetch.abort()
        }
        self.statsFetchInProgress = aborter
      },

      setResolution(res: number) {
        self.resolution = res
      },

      setFill(fill: boolean) {
        self.fill = fill
      },

      toggleLogScale() {
        if (self.scale !== 'log') {
          self.scale = 'log'
        } else {
          self.scale = 'linear'
        }
      },

      setAutoscale(val: string) {
        self.autoscale = val
      },
    }))
    .views(self => {
      const { trackMenuItems } = self
      let oldDomain: [number, number] = [0, 0]
      return {
        get TooltipComponent(): React.FC {
          return (Tooltip as unknown) as React.FC
        },

        get adapterTypeName() {
          return self.adapterConfig.type
        },

        get rendererTypeName() {
          const viewName = getConf(self, 'defaultRendering')
          const rendererType = rendererTypes.get(viewName)
          if (!rendererType) {
            throw new Error(`unknown alignments view name ${viewName}`)
          }
          return rendererType
        },

        get scaleType() {
          return self.scale || getConf(self, 'scaleType')
        },

        get filled() {
          return typeof self.fill !== 'undefined'
            ? self.fill
            : readConfObject(this.rendererConfig, 'filled')
        },

        get domain() {
          const maxScore = getConf(self, 'maxScore')
          const minScore = getConf(self, 'minScore')
          const ret = getNiceDomain({
            domain: [self.stats.scoreMin, self.stats.scoreMax],
            scaleType: this.scaleType,
            bounds: [minScore, maxScore],
          })

          // avoid weird scalebar if log value and empty region displayed
          if (this.scaleType === 'log' && ret[1] === Number.MIN_VALUE) {
            return [0, Number.MIN_VALUE]
          }

          // uses a heuristic to just give some extra headroom on bigwig scores
          if (maxScore !== Number.MIN_VALUE && ret[1] > 1.0) {
            ret[1] = round(ret[1])
          }
          if (minScore !== Number.MAX_VALUE && ret[0] < -1.0) {
            ret[0] = round(ret[0])
          }

          // avoid returning a new object if it matches the old value
          if (JSON.stringify(oldDomain) !== JSON.stringify(ret)) {
            oldDomain = ret
          }

          return oldDomain
        },

        get needsScalebar() {
          return (
            self.rendererTypeName === 'XYPlotRenderer' ||
            self.rendererTypeName === 'LinePlotRenderer'
          )
        },

        get canHaveFill() {
          return self.rendererTypeName === 'XYPlotRenderer'
        },

        get autoscaleType() {
          return self.autoscale || getConf(self, 'autoscale')
        },

        get rendererConfig() {
          const configBlob =
            getConf(self, ['renderers', this.rendererTypeName]) || {}

          return self.rendererType.configSchema.create({
            ...configBlob,
            filled: self.fill,
            scaleType: this.scaleType,
          })
        },

        get renderProps() {
          return {
            ...self.composedRenderProps,
            ...getParentRenderProps(self),
            notReady: !self.ready,
            displayModel: self,
            config: this.rendererConfig,
            scaleOpts: {
              domain: this.domain,
              stats: self.stats,
              autoscaleType: this.autoscaleType,
              scaleType: this.scaleType,
              inverted: getConf(self, 'inverted'),
            },
            resolution: self.resolution,
            height: self.height,
          }
        },

        get hasResolution() {
          const { AdapterClass } = pluginManager.getAdapterType(
            this.adapterTypeName,
          )
          // @ts-ignore
          return AdapterClass.capabilities.includes('hasResolution')
        },

        get composedTrackMenuItems() {
          return [
            ...(this.hasResolution
              ? [
                  {
                    label: 'Resolution',
                    subMenu: [
                      {
                        label: 'Finer resolution',
                        onClick: () => {
                          self.setResolution(self.resolution * 5)
                        },
                      },
                      {
                        label: 'Coarser resolution',
                        onClick: () => {
                          self.setResolution(self.resolution / 5)
                        },
                      },
                    ],
                  },
                ]
              : []),
            ...(this.canHaveFill
              ? [
                  {
                    label: this.filled
                      ? 'Turn off histogram fill'
                      : 'Turn on histogram fill',
                    onClick: () => {
                      self.setFill(!this.filled)
                    },
                  },
                ]
              : []),
            {
              label:
                this.scaleType === 'log' ? 'Set linear scale' : 'Set log scale',
              onClick: () => {
                self.toggleLogScale()
              },
            },
            ...(this.adapterTypeName === 'BigWigAdapter'
              ? [
                  {
                    label: 'Autoscale type',
                    subMenu: [
                      ['local', 'Local'],
                      ['global', 'Global'],
                      ['globalsd', 'Global ± 3σ'],
                      ['localsd', 'Local ± 3σ'],
                    ].map(([val, label]) => {
                      return {
                        label,
                        onClick() {
                          self.setAutoscale(val)
                        },
                      }
                    }),
                  },
                ]
              : []),
          ]
        },

        get trackMenuItems() {
          return [...trackMenuItems, ...this.composedTrackMenuItems]
        },
      }
    })
    .actions(self => {
      const superReload = self.reload

      async function getStats(opts: {
        headers?: Record<string, string>
        signal?: AbortSignal
      }): Promise<FeatureStats> {
        const { rpcManager } = getSession(self)
        const nd = getConf(self, 'numStdDev')
        const { adapterConfig, autoscaleType } = self
        if (autoscaleType === 'global' || autoscaleType === 'globalsd') {
          const results = (await rpcManager.call(
            getRpcSessionId(self),
            'WiggleGetGlobalStats',
            {
              adapterConfig,
              statusCallback: (message: string) => {
                if (isAlive(self)) {
                  self.setMessage(message)
                }
              },
              ...opts,
            },
          )) as FeatureStats
          const { scoreMin, scoreMean, scoreStdDev } = results
          // globalsd uses heuristic to avoid unnecessary scoreMin<0
          // if the scoreMin is never less than 0
          // helps with most coverage bigwigs just being >0
          return autoscaleType === 'globalsd'
            ? {
                ...results,
                scoreMin: scoreMin >= 0 ? 0 : scoreMean - nd * scoreStdDev,
                scoreMax: scoreMean + nd * scoreStdDev,
              }
            : results
        }
        if (autoscaleType === 'local' || autoscaleType === 'localsd') {
          const { dynamicBlocks, bpPerPx } = getContainingView(self) as LGV
          const sessionId = getRpcSessionId(self)
          const results = (await rpcManager.call(
            sessionId,
            'WiggleGetMultiRegionStats',
            {
              adapterConfig,
              assemblyName: getTrackAssemblyNames(self.parentTrack)[0],
              regions: JSON.parse(
                JSON.stringify(
                  dynamicBlocks.contentBlocks.map(region => {
                    const { start, end } = region
                    return {
                      ...region,
                      start: Math.floor(start),
                      end: Math.ceil(end),
                    }
                  }),
                ),
              ),
              sessionId,
              statusCallback: (message: string) => {
                if (isAlive(self)) {
                  self.setMessage(message)
                }
              },
              bpPerPx,
              ...opts,
            },
          )) as FeatureStats
          const { scoreMin, scoreMean, scoreStdDev } = results
          // localsd uses heuristic to avoid unnecessary scoreMin<0
          // if the scoreMin is never less than 0
          // helps with most coverage bigwigs just being >0
          return autoscaleType === 'localsd'
            ? {
                ...results,
                scoreMin: scoreMin >= 0 ? 0 : scoreMean - nd * scoreStdDev,
                scoreMax: scoreMean + nd * scoreStdDev,
              }
            : results
        }
        if (autoscaleType === 'zscale') {
          return rpcManager.call(
            getRpcSessionId(self),
            'WiggleGetGlobalStats',
            {
              adapterConfig,
              statusCallback: (message: string) => {
                if (isAlive(self)) {
                  self.setMessage(message)
                }
              },
              ...opts,
            },
          ) as Promise<FeatureStats>
        }
        throw new Error(`invalid autoscaleType '${autoscaleType}'`)
      }
      return {
        // re-runs stats and refresh whole display on reload
        async reload() {
          self.setError('')
          const aborter = new AbortController()
          const stats = await getStats({
            signal: aborter.signal,
            headers: { cache: 'no-store,no-cache' },
          })
          if (isAlive(self)) {
            self.updateStats(stats)
            superReload()
          }
        },
        afterAttach() {
          addDisposer(
            self,
            autorun(
              async () => {
                try {
                  const aborter = new AbortController()
                  self.setLoading(aborter)
                  const view = getContainingView(self) as LGV
                  if (
                    (!view.initialized && !self.ready) ||
                    view.bpPerPx > self.maxViewBpPerPx
                  ) {
                    return
                  }

                  const stats = await getStats({ signal: aborter.signal })

                  if (isAlive(self)) {
                    self.updateStats(stats)
                  }
                } catch (e) {
                  if (!isAbortException(e) && isAlive(self)) {
                    self.setError(e)
                  }
                }
              },
              { delay: 1000 },
            ),
          )
        },
      }
    })

export type WiggleDisplayStateModel = ReturnType<typeof stateModelFactory>
export type WiggleDisplayModel = Instance<WiggleDisplayStateModel>

export default stateModelFactory
