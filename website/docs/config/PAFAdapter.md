---
id: pafadapter
title: PAFAdapter
toplevel: true
---

Note: this document is automatically generated from configuration objects in
our source code. See [Config guide](/docs/config_guide) for more info

## Docs

### PAFAdapter - Slots

#### slot: assemblyNames

```js
assemblyNames: {
      type: 'stringArray',
      defaultValue: [],
      description:
        'Array of assembly names to use for this file. The target assembly name is the first value in the array, query assembly name is the second',
    }
```

#### slot: targetAssembly

```js
targetAssembly: {
      type: 'string',
      defaultValue: '',
      description: 'Alternative to assemblyNames: the target assembly name',
    }
```

#### slot: queryAssembly

```js
queryAssembly: {
      type: 'string',
      defaultValue: '',
      description: 'Alternative to assemblyNames: the query assembly name',
    }
```

#### slot: pafLocation

```js
pafLocation: {
      type: 'fileLocation',
      defaultValue: {
        uri: '/path/to/file.paf',
        locationType: 'UriLocation',
      },
    }
```
