#!/usr/bin/env node
const path = require('path')
const Jest = require('jest')
const { formatTestResults } = require('@jest/test-result')
const { SummaryReporter } = require('@jest/reporters')

const printTestResults = (rawResults) => {
  const results = formatTestResults(rawResults)

  results
    .testResults
    .filter(test => test.message)
    .forEach(test => console.log(test.message))
}

const printSummary = (config, rawResults) => {
  // Jest's summary reporter uses process.stderr.write, but it doesn't work here
  // so we should monkey patch it to use console.log
  const originalProcessStderrWrite = process.stderr.write

  process.stderr.write = (message) => {
    console.log(message)
  }

  const reporter = new SummaryReporter(config)
  reporter.onRunComplete(new Set(), rawResults)

  process.stderr.write = originalProcessStderrWrite
}

const runner = () => {
  return new Promise(async (resolve, reject) => {
    const config = {
      _: [],
      env: 'vscode-extension',
      json: true,
      maxWorkers: 1,
      testMatch: [
        path.resolve(process.env['VSCODE_TESTS_PATH'], '**/*.test.js'),
      ],
      extraGlobals: ['vscode', 'using', 'waitFor', 'take'],
    }

    try {
      const { results: rawResults } = await Jest.runCLI(config, [process.env['VSCODE_TESTS_PATH']])

      printTestResults(rawResults)
      printSummary(config, rawResults)

      if (rawResults?.success) {
        resolve()
      } else {
        reject(new Error())
      }
    } catch (err) {
      reject(err)
    }
  })
}

exports.run = runner
