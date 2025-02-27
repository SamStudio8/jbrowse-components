import {
  BlobFile,
  GenericFilehandle,
  LocalFile,
  Fetcher,
} from 'generic-filehandle'
import isNode from 'detect-node'

// locals
import { RemoteFileWithRangeCache } from './RemoteFileWithRangeCache'
import {
  FileLocation,
  LocalPathLocation,
  BlobLocation,
  isAppRootModel,
  isUriLocation,
  AuthNeededError,
  UriLocation,
} from '../types'
import { BaseInternetAccountModel } from '../../pluggableElementTypes/models'
import { getBlob } from '../tracks'
import PluginManager from '../../PluginManager'
import { isElectron } from '../'

export { RemoteFileWithRangeCache }

function isLocalPathLocation(
  location: FileLocation,
): location is LocalPathLocation {
  return 'localPath' in location
}

function isBlobLocation(location: FileLocation): location is BlobLocation {
  return 'blobId' in location
}

export function openLocation(
  location: FileLocation,
  pluginManager?: PluginManager,
): GenericFilehandle {
  if (!location) {
    throw new Error('must provide a location to openLocation')
  }
  if (isLocalPathLocation(location)) {
    if (!location.localPath) {
      throw new Error('No local path provided')
    }

    if (isNode || isElectron) {
      return new LocalFile(location.localPath)
    } else {
      throw new Error("can't use local files in the browser")
    }
  }
  if (isBlobLocation(location)) {
    // special case where blob is not directly stored on the model, use a getter
    const blob = getBlob(location.blobId)
    if (!blob) {
      throw new Error(
        `file ("${location.name}") was opened locally from a previous session. To restore it, go to track settings and reopen the file`,
      )
    }
    return new BlobFile(blob)
  }
  if (isUriLocation(location)) {
    // Check for empty string
    if (!location.uri) {
      throw new Error('No URI provided')
    }
    // Resolve any relative URLs to absolute URLs
    const absoluteLocation = location.baseUri
      ? { ...location, uri: new URL(location.uri, location.baseUri).href }
      : location
    // If there is a plugin manager, we can try internet accounts
    if (pluginManager) {
      const internetAccount = getInternetAccount(location, pluginManager)
      // If an internetAccount was found, use it to open the location
      if (internetAccount) {
        return internetAccount.openLocation(absoluteLocation)
      }
    }
    // Otherwise fall back on usual open
    return new RemoteFileWithRangeCache(absoluteLocation.uri, {
      fetch: checkAuthNeededFetch,
    })
  }
  throw new Error('invalid fileLocation')
}

export function getFetcher(
  location: FileLocation,
  pluginManager?: PluginManager,
): Fetcher {
  if (!isUriLocation(location)) {
    throw new Error(`Not a valid UriLocation: ${JSON.stringify(location)}`)
  }
  if (pluginManager) {
    const internetAccount = getInternetAccount(location, pluginManager)
    if (internetAccount) {
      return internetAccount.getFetcher(location)
    }
  }
  return checkAuthNeededFetch
}

function getInternetAccount(
  location: UriLocation,
  pluginManager: PluginManager,
): BaseInternetAccountModel | undefined {
  const { rootModel } = pluginManager
  // If there is an appRootModel, use it to find the internetAccount
  if (rootModel && isAppRootModel(rootModel)) {
    return rootModel.findAppropriateInternetAccount(location)
  }
  // If there is no appRootModel, but there is pre-auth, create a temporary
  // internetAccount. This is typical in a worker.
  if (location.internetAccountPreAuthorization) {
    if (!location.internetAccountPreAuthorization.authInfo.token) {
      throw new Error(
        'Failed to obtain token from internet account. Try reloading the page',
      )
    }
    const internetAccountType = pluginManager.getInternetAccountType(
      location.internetAccountPreAuthorization.internetAccountType,
    )
    return internetAccountType.stateModel.create({
      type: location.internetAccountPreAuthorization.internetAccountType,
      configuration:
        location.internetAccountPreAuthorization.authInfo.configuration,
    })
  }
  return
}

// This fetch throws a special error if the response is "401" and includes a
// "WWW-Authenticate: Basic" header. This is so downstream code can retry if
// needed with HTTP Basic authentication included
async function checkAuthNeededFetch(
  url: RequestInfo,
  opts?: RequestInit,
): Promise<Response> {
  const response = await fetch(url, opts)
  if (response.status === 401) {
    const authHeaders = response.headers.get('WWW-Authenticate')
    if (authHeaders && authHeaders.includes('Basic')) {
      throw new AuthNeededError(
        'Accessing HTTPBasic resource without authentication',
        url.toString(),
      )
    }
  }
  return response
}
