#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const insertMonkeyPatchAllowMocks = (extensionDevelopmentPath) => {
  const packageJsonPath = path.resolve(extensionDevelopmentPath, 'package.json')
  const { main } = require(packageJsonPath)

  const mainPath = path.resolve(extensionDevelopmentPath, main)

  const mainContent = fs.readFileSync(mainPath)
  if (mainContent.toString().includes('global.extensionVscode')) {
    return
  }

  fs.appendFileSync(mainPath, "\n\nglobal.extensionVscode = require('vscode');\n")
}

if (require.main === module) {
  insertMonkeyPatchAllowMocks(process.argv[2])
}

module.exports = insertMonkeyPatchAllowMocks
