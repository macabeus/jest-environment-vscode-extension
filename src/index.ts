import NodeEnvironment from 'jest-environment-node'
import type { Config } from '@jest/types'
import type { TextDocument } from 'vscode'
import * as vscode from 'vscode'
import * as path from 'path'
import dedent from 'dedent-js'
import usingFiles from './usingFiles'
import usingMocks from './usingMocks'
import waitFor from './waitFor'
import take from './take'

type Using = <Files extends { [filename: string]: string }>(
  params: {
    files: Files
    mocks?: {
      [path: string]: unknown
    }
  },
  closure: (mapFileToUri: {
    [filename in keyof Files]: TextDocument
  }) => Promise<void>
) => Promise<void>

class VsCodeExtensionEnvironment extends NodeEnvironment {
  constructor (config: Config.ProjectConfig) {
    super(config)

    const workspacePath = path.join(config.rootDir, 'test-workspace')

    const using: Using = ({ files, mocks = {} }, closure) =>
      usingFiles(
        workspacePath,
        files,
        (mapFileToDoc) => usingMocks(mocks, () => closure(mapFileToDoc))
      )

    this.global.vscode = vscode
    this.global.using = using
    this.global.dedent = dedent
    this.global.waitFor = waitFor
    this.global.take = take
  }
}

export default VsCodeExtensionEnvironment
