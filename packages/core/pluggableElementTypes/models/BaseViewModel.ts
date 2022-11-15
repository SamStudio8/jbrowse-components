import { types, Instance } from 'mobx-state-tree'
import { ElementId } from '../../util/types/mst'
import { MenuItem } from '../../ui'

const BaseViewModel = types
  .model('BaseView', {
    id: ElementId,
    displayName: types.maybe(types.string),
    minimized: false,
  })
  .volatile(() => ({
    width: 800,
  }))
  .views(() => ({
    menuItems(): MenuItem[] {
      return []
    },
  }))
  .actions(self => ({
    setDisplayName(name: string) {
      self.displayName = name
    },
    setWidth(newWidth: number) {
      self.width = newWidth
    },
    setMinimized(flag: boolean) {
      self.minimized = flag
    },
  }))

export default BaseViewModel
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IBaseViewModel extends Instance<typeof BaseViewModel> {}
