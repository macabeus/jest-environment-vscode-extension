import { workspace, window, Uri } from 'vscode'

const timeout = 2000

const loopDocumentChangeCheck = async (
  startedAt: number,
  uri: Uri,
  originalText: string,
  onChange: (currentText: string) => void,
  onTimeout: (currentText: string) => void
) => {
  const doc = await workspace.openTextDocument(uri)
  const textEditor = await window.showTextDocument(doc)
  const text = textEditor.document.getText()

  if (text !== originalText) {
    onChange(text)
    return
  }

  if (
    (new Date().getTime()) > (startedAt + timeout)
  ) {
    onTimeout(text)
    return
  }

  setTimeout(() => {
    loopDocumentChangeCheck(startedAt, uri, originalText, onChange, onTimeout)
  }, 250)
}

const documentChange = (uri: Uri) => {
  return new Promise<string>(async (resolve, reject) => {
    const doc = await workspace.openTextDocument(uri)
    const textEditor = await window.showTextDocument(doc)
    const originalText = textEditor.document.getText()

    loopDocumentChangeCheck(
      (new Date()).getTime(),
      uri,
      originalText,
      resolve,
      () => reject(new Error('Unexpected document change'))
    )
  })
}

const notDocumentChange = (uri: Uri) => {
  return new Promise<string>(async (resolve, reject) => {
    const doc = await workspace.openTextDocument(uri)
    const textEditor = await window.showTextDocument(doc)
    const originalText = textEditor.document.getText()

    loopDocumentChangeCheck(
      (new Date()).getTime(),
      uri,
      originalText,
      () => reject(new Error('Expected document change')),
      resolve
    )
  })
}

export default {
  documentChange,
  not: {
    documentChange: notDocumentChange,
  },
}
