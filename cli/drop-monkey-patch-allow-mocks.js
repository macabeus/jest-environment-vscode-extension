#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const dropMonkeyPatchAllowMocks = (extensionDevelopmentPath) => {
  const packageJsonPath = path.resolve(extensionDevelopmentPath, 'package.json')
  const { main } = require(packageJsonPath)

  const mainPath = path.resolve(extensionDevelopmentPath, main)

  const mainContent = fs.readFileSync(mainPath)
  const textContent = mainContent.toString()
  if (textContent.includes('global.extensionVscode') === false) {
    return
  }

  fs.writeFileSync(
    mainPath,
    textContent.replace("\n\nglobal.extensionVscode = require('vscode');\n", '')
  )
}

if (require.main === module) {
  dropMonkeyPatchAllowMocks(process.argv[2])
}

module.exports = dropMonkeyPatchAllowMocks
