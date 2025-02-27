---
id: xyplotrenderer
title: XYPlotRenderer
toplevel: true
---

Note: this document is automatically generated from configuration objects in
our source code. See [Config guide](/docs/config_guide) for more info

## Docs

### XYPlotRenderer - Slots

#### slot: filled

```js
filled: {
      type: 'boolean',
      defaultValue: true,
    }
```

#### slot: displayCrossHatches

```js
displayCrossHatches: {
      type: 'boolean',
      description: 'choose to draw cross hatches (sideways lines)',
      defaultValue: false,
    }
```

#### slot: summaryScoreMode

```js
summaryScoreMode: {
      type: 'stringEnum',
      model: types.enumeration('Score type', ['max', 'min', 'avg', 'whiskers']),
      description:
        'choose whether to use max/min/average or whiskers which combines all three into the same rendering',
      defaultValue: 'whiskers',
    }
```

#### slot: minSize

```js
minSize: {
      type: 'number',
      defaultValue: 0,
    }
```

## XYPlotRenderer - Derives from

```js
baseConfiguration: baseWiggleRendererConfigSchema
```
