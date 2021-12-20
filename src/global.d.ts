import type * as vscode from 'vscode'

declare global {
  // we should use "var" to expose this property to globalThis
  // eslint-disable-next-line no-var
  var extensionVscode: typeof vscode | undefined
}
