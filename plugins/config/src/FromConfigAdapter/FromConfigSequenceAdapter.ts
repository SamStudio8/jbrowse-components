import SimpleFeature, { Feature } from '@jbrowse/core/util/simpleFeature'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { NoAssemblyRegion } from '@jbrowse/core/util/types'
import { toArray } from 'rxjs/operators'
import FromConfigAdapter from './FromConfigAdapter'
import { RegionsAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'

export default class FromConfigSequenceAdapter
  extends FromConfigAdapter
  implements RegionsAdapter
{
  /**
   * Fetch features for a certain region
   * @param region - Region
   * @returns Observable of Feature objects in the region
   */
  getFeatures(region: NoAssemblyRegion) {
    return ObservableCreate<Feature>(async observer => {
      const feats = await super.getFeatures(region).pipe(toArray()).toPromise()
      const feat = feats[0]
      observer.next(
        new SimpleFeature({
          ...feat.toJSON(),
          uniqueId: `${feat.id()}:${region.start}-${region.end}`,
          end: region.end,
          start: region.start,
          seq: feat
            .get('seq')
            .slice(
              Math.max(region.start - feat.get('start'), 0),
              Math.max(region.end - feat.get('start'), 0),
            ),
        }),
      )

      observer.complete()
    })
  }

  /**
   * Get refName, start, and end for all features after collapsing any overlaps
   */
  async getRegions() {
    const regions = []

    // recall: features are stored in this object sorted by start coordinate
    for (const [refName, features] of this.features) {
      let currentRegion
      for (const feature of features) {
        if (
          currentRegion &&
          currentRegion.end >= feature.get('start') &&
          currentRegion.start <= feature.get('end')
        ) {
          currentRegion.end = feature.get('end')
        } else {
          if (currentRegion) {
            regions.push(currentRegion)
          }
          currentRegion = {
            refName,
            start: feature.get('start'),
            end: feature.get('end'),
          }
        }
      }
      if (currentRegion) {
        regions.push(currentRegion)
      }
    }

    return regions
  }

  /**
   * called to provide a hint that data tied to a certain region
   * will not be needed for the forseeable future and can be purged
   * from caches, etc
   */
  freeResources(/* { region } */): void {}
}
