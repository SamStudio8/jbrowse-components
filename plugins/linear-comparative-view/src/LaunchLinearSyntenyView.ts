import PluginManager from '@jbrowse/core/PluginManager'
import { AbstractSessionModel } from '@jbrowse/core/util'
import { LinearSyntenyViewModel } from './LinearSyntenyView/model'
import { when } from 'mobx'

type LSV = LinearSyntenyViewModel

export default function LaunchLinearSyntenyView(pluginManager: PluginManager) {
  pluginManager.addToExtensionPoint(
    'LaunchView-LinearSyntenyView',
    // @ts-ignore
    async ({
      session,
      views,
      tracks = [],
    }: {
      session: AbstractSessionModel
      views: { loc: string; assembly: string; tracks?: string[] }[]
      tracks?: string[]
    }) => {
      try {
        const { assemblyManager } = session
        const model = session.addView('LinearSyntenyView', {}) as LSV

        await when(() => !!model.width)

        model.setViews(
          await Promise.all(
            views.map(async view => {
              const asm = await assemblyManager.waitForAssembly(view.assembly)
              if (!asm) {
                throw new Error(`Assembly ${view.assembly} failed to load`)
              }
              return {
                type: 'LinearGenomeView' as const,
                bpPerPx: 1,
                offsetPx: 0,
                hideHeader: true,
                displayedRegions: asm.regions,
              }
            }),
          ),
        )

        await Promise.all(model.views.map(view => when(() => view.initialized)))

        const idsNotFound = [] as string[]
        for (let i = 0; i < views.length; i++) {
          const view = model.views[i]
          const { loc, tracks = [] } = views[i]

          view.navToLocString(loc)
          tracks.forEach(track => tryTrack(view, track, idsNotFound))
        }

        tracks.forEach(track => tryTrack(model, track, idsNotFound))

        if (idsNotFound.length) {
          throw new Error(
            `Could not resolve identifiers: ${idsNotFound.join(',')}`,
          )
        }
      } catch (e) {
        session.notify(`${e}`, 'error')
        throw e
      }
    },
  )
}

function tryTrack(
  model: { showTrack: (arg: string) => void },
  trackId: string,
  idsNotFound: string[],
) {
  try {
    model.showTrack(trackId)
  } catch (e) {
    if (`${e}`.match('Could not resolve identifier')) {
      idsNotFound.push(trackId)
    } else {
      throw e
    }
  }
}
