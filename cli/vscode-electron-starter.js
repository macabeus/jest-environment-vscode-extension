#!/usr/bin/env node
const path = require('path')
const os = require('os')
const { runTests } = require('@vscode/test-electron')
const insertMonkeyPatchAllowMocks = require('./insert-monkey-patch-allow-mocks')
const dropMonkeyPatchAllowMocks = require('./drop-monkey-patch-allow-mocks')

const getRandomTempDiretory = () => {
  const timestamp = Date.now()
  const folderName = `test-extension-${timestamp}`
  const tempPath = path.resolve(os.tmpdir(), folderName)

  return tempPath
}

const runNoWorkspace = async ({ extensionDevelopmentPath, extensionTestsPath, version, testsPath }) => {
	await runTests({
    version,
		extensionDevelopmentPath,
		extensionTestsPath,
    launchArgs: [
      `--user-data-dir=${getRandomTempDiretory()}`,
    ],
		extensionTestsEnv: {
			VSCODE_TESTS_PATH: path.resolve(extensionDevelopmentPath, testsPath),
		},
	})
}

const runWithWorkspace = async ({ extensionDevelopmentPath, extensionTestsPath, version, testsPath }) => {
  const testWorkspace = path.resolve(extensionDevelopmentPath, 'test-workspace')

	await runTests({
    version,
		extensionDevelopmentPath,
		extensionTestsPath,
    launchArgs: [
      testWorkspace,
      `--user-data-dir=${getRandomTempDiretory()}`,
    ],
		extensionTestsEnv: {
			VSCODE_TESTS_PATH: path.resolve(extensionDevelopmentPath, testsPath),
		},
	})
}

const start = async () => {
  const [testScenery, version, testsPath] = [process.argv[2], process.argv[3], process.argv[4]]
  const extensionDevelopmentPath = process.cwd()

  const extensionTestsPath = path.resolve(
    extensionDevelopmentPath,
    'node_modules/.bin/vscode-tests-runner'
  )

  insertMonkeyPatchAllowMocks(extensionDevelopmentPath)
  
	try {
    if (testScenery === 'with-workspace') {
      await runWithWorkspace({ extensionDevelopmentPath, extensionTestsPath, version, testsPath })
    } else if (testScenery === 'no-workspace') {
      await runNoWorkspace({ extensionDevelopmentPath, extensionTestsPath, version, testsPath })
    } else {
      throw new Error(`Unknown test scenery: ${testScenery}`)
    }
	} catch (err) {
		console.error('Failed to run tests')
		console.log(err)
		process.exit(1)
  } finally {
    dropMonkeyPatchAllowMocks(extensionDevelopmentPath)
	}
}

start()
