#!/usr/bin/env node
const path = require('path')
const { runTests } = require('@vscode/test-electron')
const insertMonkeyPatchAllowMocks = require('./insert-monkey-patch-allow-mocks')
const dropMonkeyPatchAllowMocks = require('./drop-monkey-patch-allow-mocks')

const runNoWorkspace = async ({ extensionDevelopmentPath, extensionTestsPath, version }) => {
	await runTests({
    version,
		extensionDevelopmentPath,
		extensionTestsPath,
		extensionTestsEnv: {
			VSCODE_TESTS_PATH: path.resolve(extensionDevelopmentPath, 'out/tests/no-workspace'),
		},
	})
}

const runWithWorkspace = async ({ extensionDevelopmentPath, extensionTestsPath, version }) => {
  const testWorkspace = path.resolve(extensionDevelopmentPath, 'test-workspace')

	await runTests({
    version,
		extensionDevelopmentPath,
		extensionTestsPath,
    launchArgs: [
      testWorkspace,
    ],
		extensionTestsEnv: {
			VSCODE_TESTS_PATH: path.resolve(extensionDevelopmentPath, 'out/tests/with-workspace'),
		},
	})
}

const start = async () => {
	const [testScenery, extensionDevelopmentPath, version] = [process.argv[2], process.argv[3], process.argv[4]]
	const extensionTestsPath = path.resolve(
    extensionDevelopmentPath,
    'node_modules/.bin/vscode-tests-runner'
  )

  insertMonkeyPatchAllowMocks(extensionDevelopmentPath)
  
	try {
    if (testScenery === 'with-workspace') {
      await runWithWorkspace({ extensionDevelopmentPath, extensionTestsPath, version })
    } else if (testScenery === 'no-workspace') {
      await runNoWorkspace({ extensionDevelopmentPath, extensionTestsPath, version })
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
