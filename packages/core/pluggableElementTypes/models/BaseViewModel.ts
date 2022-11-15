import { types, Instance } from 'mobx-state-tree'
import { ElementId } from '../../util/types/mst'
import { MenuItem } from '../../ui'

/**
 * #stateModel BaseViewModel
 */
const BaseViewModel = types
  .model('BaseView', {
    /**
     * #property
     */
    id: ElementId,
    /**
     * #property
     */
    displayName: types.maybe(types.string),
    /**
     * #property
     */
    minimized: false,
  })
  .volatile(() => ({
    width: 800,
  }))
  .views(() => ({
    /**
     * #getter
     */
    menuItems(): MenuItem[] {
      return []
    },
  }))
  .actions(self => ({
    /**
     * #action
     */
    setDisplayName(name: string) {
      self.displayName = name
    },
    /**
     * #action
     * setWidth is updated by a ResizeObserver generally, the views often need
     * to know how wide they are to properly draw genomic regions
     */
    setWidth(newWidth: number) {
      self.width = newWidth
    },
    /**
     * #action
     */
    setMinimized(flag: boolean) {
      self.minimized = flag
    },
  }))

export default BaseViewModel
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IBaseViewModel extends Instance<typeof BaseViewModel> {}
