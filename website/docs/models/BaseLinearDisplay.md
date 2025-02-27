---
id: baselineardisplay
title: BaseLinearDisplay
toplevel: true
---

Note: this document is automatically generated from mobx-state-tree objects in
our source code. See [Core concepts and intro to pluggable
elements](/docs/developer_guide/) for more info

extends `BaseDisplay`

### BaseLinearDisplay - Properties

#### property: height

```js
// type signature
IOptionalIType<ISimpleType<number>, [undefined]>
// code
height: types.optional(
          types.refinement(
            'displayHeight',
            types.number,
            n => n >= minDisplayHeight,
          ),
          defaultDisplayHeight,
        )
```

#### property: blockState

updated via autorun

```js
// type signature
IMapType<IModelType<{ key: ISimpleType<string>; region: IModelType<{ refName: ISimpleType<string>; start: ISimpleType<number>; end: ISimpleType<number>; reversed: IOptionalIType<...>; } & { ...; }, { ...; }, _NotCustomized, _NotCustomized>; reloadFlag: IType<...>; isLeftEndOfDisplayedRegion: IType<...>; isRightEndOf...
// code
blockState: types.map(BlockState)
```

#### property: userBpPerPxLimit

```js
// type signature
IMaybe<ISimpleType<number>>
// code
userBpPerPxLimit: types.maybe(types.number)
```

#### property: userByteSizeLimit

```js
// type signature
IMaybe<ISimpleType<number>>
// code
userByteSizeLimit: types.maybe(types.number)
```

### BaseLinearDisplay - Getters

#### getter: blockType

```js
// type
'staticBlocks' | 'dynamicBlocks'
```

#### getter: blockDefinitions

```js
// type
any
```

#### getter: renderDelay

how many milliseconds to wait for the display to
"settle" before re-rendering a block

```js
// type
number
```

#### getter: TooltipComponent

```js
// type
React.FC<any>
```

#### getter: selectedFeatureId

returns a string feature ID if the globally-selected object
is probably a feature

```js
// type
string
```

#### getter: DisplayMessageComponent

if a display-level message should be displayed instead of the blocks,
make this return a react component

```js
// type
any
```

#### getter: features

a CompositeMap of `featureId -> feature obj` that
just looks in all the block data for that feature

```js
// type
CompositeMap<unknown, unknown>
```

#### getter: featureUnderMouse

```js
// type
any
```

#### getter: getFeatureOverlapping

```js
// type
;(blockKey: string, x: number, y: number) => any
```

#### getter: getFeatureByID

```js
// type
;(blockKey: string, id: string) => LayoutRecord
```

#### getter: searchFeatureByID

```js
// type
;(id: string) => LayoutRecord
```

#### getter: currentBytesRequested

```js
// type
number
```

#### getter: currentFeatureScreenDensity

```js
// type
number
```

#### getter: maxFeatureScreenDensity

```js
// type
any
```

#### getter: estimatedStatsReady

```js
// type
boolean
```

#### getter: maxAllowableBytes

```js
// type
number
```

#### getter: regionTooLarge

region is too large if:

- stats are ready
- region is greater than 20kb (don't warn when zoomed in less than that)
- and bytes is greater than max allowed bytes or density greater than max density

```js
// type
boolean
```

#### getter: regionTooLargeReason

only shows a message of bytes requested is defined, the feature density
based stats don't produce any helpful message besides to zoom in

```js
// type
string
```

### BaseLinearDisplay - Methods

#### method: regionCannotBeRenderedText

```js
// type signature
regionCannotBeRenderedText: (_region: Region) =>
  '' | 'Force load to see features'
```

#### method: regionCannotBeRendered

```js
// type signature
regionCannotBeRendered: (_region: Region) => Element
```

#### method: trackMenuItems

```js
// type signature
trackMenuItems: () => MenuItem[]
```

#### method: contextMenuItems

```js
// type signature
contextMenuItems: () => { label: string; icon: OverridableComponent<SvgIconTypeMap<{}, "svg">> & { muiName: string; }; onClick: () => void; }[]
```

#### method: renderProps

```js
// type signature
renderProps: () => any
```

#### method: renderSvg

```js
// type signature
renderSvg: (opts: ExportSvgOptions & { overrideHeight: number; }) => Promise<Element>
```

### BaseLinearDisplay - Actions

#### action: setMessage

```js
// type signature
setMessage: (message: string) => void
```

#### action: estimateRegionsStats

```js
// type signature
estimateRegionsStats: (regions: Region[], opts: { headers?: Record<string, string>; signal?: AbortSignal; filters?: string[]; }) => Promise<{}>
```

#### action: setRegionStatsP

```js
// type signature
setRegionStatsP: (p?: Promise<Stats>) => void
```

#### action: setRegionStats

```js
// type signature
setRegionStats: (estimatedRegionStats?: Stats) => void
```

#### action: clearRegionStats

```js
// type signature
clearRegionStats: () => void
```

#### action: setHeight

```js
// type signature
setHeight: (displayHeight: number) => number
```

#### action: resizeHeight

```js
// type signature
resizeHeight: (distance: number) => number
```

#### action: setScrollTop

```js
// type signature
setScrollTop: (scrollTop: number) => void
```

#### action: updateStatsLimit

```js
// type signature
updateStatsLimit: (stats: Stats) => void
```

#### action: addBlock

```js
// type signature
addBlock: (key: string, block: BaseBlock) => void
```

#### action: setCurrBpPerPx

```js
// type signature
setCurrBpPerPx: (n: number) => void
```

#### action: deleteBlock

```js
// type signature
deleteBlock: (key: string) => void
```

#### action: selectFeature

```js
// type signature
selectFeature: (feature: Feature) => void
```

#### action: clearFeatureSelection

```js
// type signature
clearFeatureSelection: () => void
```

#### action: setFeatureIdUnderMouse

```js
// type signature
setFeatureIdUnderMouse: (feature: string) => void
```

#### action: reload

```js
// type signature
reload: () => void
```

#### action: setContextMenuFeature

```js
// type signature
setContextMenuFeature: (feature?: Feature) => void
```

#### action: reload

```js
// type signature
reload: () => Promise<void>
```
