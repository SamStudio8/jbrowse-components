---
id: baselineardisplay
title: BaseLinearDisplay
toplevel: true
---

Note: this document is automatically generated from configuration objects in
our source code. See [Config guide](/docs/config_guide) for more info

## Docs

BaseLinearDisplay is a "base" config that is extended by classes like
"LinearBasicDisplay" (used for feature tracks, etc) and "LinearBareDisplay"
(more stripped down than even the basic display, not commonly used)

### BaseLinearDisplay - Identifier

#### slot: explicitIdentifier

### BaseLinearDisplay - Slots

#### slot: maxFeatureScreenDensity

```js
maxFeatureScreenDensity: {
      type: 'number',
      description:
        'maximum features per pixel that is displayed in the view, used if byte size estimates not available',
      defaultValue: 0.3,
    }
```

#### slot: fetchSizeLimit

```js
fetchSizeLimit: {
      type: 'number',
      defaultValue: 1_000_000,
      description:
        "maximum data to attempt to download for a given track, used if adapter doesn't specify one",
    }
```
