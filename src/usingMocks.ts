import keys from 'lodash/keys'
import set from 'lodash/set'
import get from 'lodash/get'

type Mocks = { [key: string]: unknown }

const vscodeOriginalProperties: Mocks = {}

const usingVscodeMocks = async (mocks: Mocks, closure: () => Promise<void>) => {
  const globalVscode = globalThis.extensionVscode

  if (globalVscode === undefined) {
    throw new Error('Missing "global.extensionVscode". Check the setup documentation for jest-environment-vscode-extension')
  }

  const mocksPath = keys(mocks)
  mocksPath.forEach(path => {
    vscodeOriginalProperties[path] = get(globalVscode, path)
    set(globalVscode, path, mocks[path])
  })

  try {
    await closure()
  } finally {
    mocksPath.forEach(path => {
      set(globalVscode, path, vscodeOriginalProperties[path])
      delete vscodeOriginalProperties[path]  
    })
  }
}

export default usingVscodeMocks
