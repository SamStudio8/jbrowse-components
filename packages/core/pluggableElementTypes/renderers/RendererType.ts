import React, { ReactElement } from 'react'
import { getDefaultValue } from '../../util/mst-reflection'
import PluggableElementBase from '../PluggableElementBase'
import { AnyConfigurationSchemaType } from '../../configuration/configurationSchema'
import { AnyReactComponentType } from '../../util'

export default class RendererType extends PluggableElementBase {
  ReactComponent: AnyReactComponentType

  configSchema: AnyConfigurationSchemaType

  constructor(stuff: {
    name: string
    ReactComponent: AnyReactComponentType
    configSchema: AnyConfigurationSchemaType
  }) {
    super(stuff)
    this.ReactComponent = stuff.ReactComponent
    this.configSchema = stuff.configSchema

    if (!this.ReactComponent) {
      throw new Error(`no ReactComponent defined for renderer ${this.name}`)
    }
    if (!getDefaultValue(this.configSchema).type) {
      throw new Error(
        `${this.name} config schema ${this.configSchema.name} is not explicitlyTyped`,
      )
    }
  }

  async render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>,
  ): Promise<{ element: ReactElement } | { html: string }> {
    return { element: React.createElement(this.ReactComponent, props, null) }
  }

  /**
   * frees resources associated with the given range, session, etc.
   * optionally returns the number of data items deleted
   */
  freeResources(/* specification: {} */): number {
    return 0
  }
}
