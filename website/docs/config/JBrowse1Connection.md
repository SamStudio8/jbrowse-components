---
id: jbrowse1connection
title: JBrowse1Connection
toplevel: true
---

Note: this document is automatically generated from configuration objects in
our source code. See [Config guide](/docs/config_guide) for more info

## Docs

### JBrowse1Connection - Slots

#### slot: dataDirLocation

```js
dataDirLocation: {
      type: 'fileLocation',
      defaultValue: {
        uri: 'http:
        locationType: 'UriLocation',
      },
      description:
        'the location of the JBrowse 1 data directory, often something like http:
    }
```

#### slot: assemblyNames

```js
assemblyNames: {
      description:
        'name of the assembly the connection belongs to, should be a single entry',
      type: 'stringArray',
      defaultValue: [],
    }
```

## JBrowse1Connection - Derives from

```js
baseConfiguration: baseConnectionConfig
```
