import { window, Range, commands, Position, TextDocument, Uri, workspace, WorkspaceEdit } from 'vscode'
import * as path from 'path'
import { readdirSync, rmSync } from 'fs'
import mapValues from 'lodash/mapValues'

/**
 * Try to run a VS Code feature on the files.
 * It's necessary because sometimes the files are created but can't be used instantially.
 */
const warmUpFiles = (mapFileToDoc: { [filename: string]: TextDocument }): Promise<void> =>
  new Promise(async (resolve) => {
    try {
      for (const file in mapFileToDoc) {
        const doc = mapFileToDoc[file]
        await window.showTextDocument(doc)

        // run code active to ensure that the file is ready
        await commands.executeCommand(
          'vscode.executeCodeActionProvider',
          doc.uri,
          new Range(new Position(0, 0), new Position(0, 0))
        )
      }
    } catch {
      await warmUpFiles(mapFileToDoc)
    }

    resolve()
  })

type UsingFiles = <Files extends { [filename: string]: string }>(
  workspacePath: string,
  files: Files,
  closure: (mapFileToDoc: {
    [filename in keyof Files]: TextDocument
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

  const mapFileToDoc: { [filename: string]: TextDocument } = {}
  for (const filename in mapFilenameToUri) {
    mapFileToDoc[filename] = await workspace.openTextDocument(mapFilenameToUri[filename])
  }

  await warmUpFiles(mapFileToDoc)

  // call closure
  try {
    await closure(mapFileToDoc as {
      [filename in keyof typeof files]: TextDocument
    })
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
