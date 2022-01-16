import { commands, Position, Uri, workspace, WorkspaceEdit } from 'vscode'
import * as path from 'path'
import { readdirSync, rmSync } from 'fs'
import mapValues from 'lodash/mapValues'

type UsingFiles = <Files extends { [filename: string]: string }>(
  workspacePath: string,
  files: Files,
  closure: (mapFileToUri: {
    [filename in keyof Files]: Uri
  }) => Promise<void>
) => Promise<void>

const removeWorkspaceTestContent = (workspacePath: string) => {
  readdirSync(workspacePath).forEach((filename) => {
    const fullPath = path.resolve(workspacePath, filename)
    rmSync(fullPath, { force: true, recursive: true })
  })
}

const usingFiles: UsingFiles = async (workspacePath, files, closure) => {
  removeWorkspaceTestContent(workspacePath)

  const mapFilenameToUri = mapValues(
    files,
    (_content, filename) => Uri.file(path.join(workspacePath, filename))
  )

  // create the files
  const weCreateFiles = new WorkspaceEdit()
  Object.entries(files).forEach(([filename, content]) => {
    const fileUri = mapFilenameToUri[filename]
    weCreateFiles.createFile(fileUri)
    weCreateFiles.insert(fileUri, new Position(0, 0), content)
  })

  await workspace.applyEdit(weCreateFiles)
  await workspace.saveAll()

  // call closure
  try {
    await closure(mapFilenameToUri)
  } finally {
    // close and delete the files created
    await commands.executeCommand('workbench.action.closeAllEditors')
  
    const weDeleteFiles = new WorkspaceEdit()
    Object.values(mapFilenameToUri).forEach((uri) => {
      weDeleteFiles.deleteFile(uri)
    })
  
    await workspace.applyEdit(weDeleteFiles)
  }
}

export default usingFiles
