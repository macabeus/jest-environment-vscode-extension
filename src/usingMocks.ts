import dedent from 'dedent-js'
import keys from 'lodash/keys'
import set from 'lodash/set'
import get from 'lodash/get'
import size from 'lodash/size'

type Mocks = { [key: string]: unknown }

const vscodeOriginalProperties: Mocks = {}

const usingVscodeMocks = async (mocks: Mocks, closure: () => Promise<void>) => {
  if (size(mocks) === 0) {
    await closure()
    return
  }

  const globalVscode = globalThis.extensionVscode

  if (globalVscode === undefined) {
    throw new Error(dedent(`
      Missing "global.extensionVscode". We can't mock VSCode.
      It can happen because of two reasons:
      - the extension was not initialized
      - wrong jest-environment-vscode-extension setup
    `))
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
