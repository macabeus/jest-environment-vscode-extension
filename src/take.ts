import { window, commands, CodeAction, workspace, Uri, Range, Hover, Position, SymbolInformation, Location, LocationLink, TextDocument } from 'vscode'

const codeActions = async (doc: TextDocument, range: Range) => {
  await window.showTextDocument(doc)

  const rawCodeActions = await commands.executeCommand('vscode.executeCodeActionProvider', doc.uri, range) as CodeAction[]

  const codeActions = rawCodeActions.reduce((acc, codeAction) => {
    const { command: codeActionCommand } = codeAction

    if (codeActionCommand) {
      const args = codeActionCommand.arguments ?? []
      acc[codeAction.title] = () => commands.executeCommand(codeActionCommand.command, ...args)  
    }

    return acc
  }, {} as { [codeActionTitle: string]: () => Thenable<void> })

  return codeActions
}

const definitions = async (doc: TextDocument, position: Position) => {
  await window.showTextDocument(doc)

  const definitions = await commands.executeCommand('vscode.executeDefinitionProvider', doc.uri, position) as Array<Location | LocationLink>

  return definitions
}

const hovers = async (doc: TextDocument, position: Position) => {
  await window.showTextDocument(doc)

  const hovers = await commands.executeCommand('vscode.executeHoverProvider', doc.uri, position) as Hover[]

  const hoversContent = hovers.flatMap((hover) => hover.contents.map(content => (content as { value: string }).value))

  return hoversContent
}

const documentSymbols = async (doc: TextDocument) => {
  await window.showTextDocument(doc)

  const documentSymbols = await commands.executeCommand('vscode.executeDocumentSymbolProvider', doc.uri) as SymbolInformation[]

  return documentSymbols
}

const documentText = async (doc: TextDocument) => {
  const textDocument = await window.showTextDocument(doc)
  const text = textDocument.document.getText()

  return text
}

export default {
  codeActions,
  definitions,
  hovers,
  documentSymbols,
  documentText,
}
