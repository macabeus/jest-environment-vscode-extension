# jest-environment-vscode-extension

> 🎪 The best way to run and write tests for your VSCode extension

<p align="center">
  <img src="https://user-images.githubusercontent.com/9501115/147397008-ab5ba201-095a-4ac4-b291-5854e9cf2db9.png">
</p>

**Key Features:**

- run tests using Jest
- built-in API making tests simpler to write and read
- zero JS configuration

## Setup

1 - Install the following packages:

```
npm install jest jest-environment-vscode-extension @types/jest @types/jest-environment-vscode-extension --save-dev
```

2 - On `.vscode/tasks.json`, add the following within the `tasks` array:

```json
{
  "label": "create-test-workspace-folder",
  "type": "shell",
  "command": "mkdir",
  "args": ["-p", "test-workspace"],
  "presentation": {
    "reveal": "silent",
    "revealProblems": "onProblem"
  }
},
{
  "label": "remove-test-workspace-folder",
  "type": "shell",
  "command": "rm",
  "args": ["-rf", "test-workspace"],
  "presentation": {
    "reveal": "silent",
    "revealProblems": "onProblem"
  }
},
{
  "label": "insert-monkey-patch-allow-mocks",
  "type": "shell",
  "command": "node ./node_modules/.bin/insert-monkey-patch-allow-mocks ${workspaceFolder}",
  "presentation": {
    "reveal": "silent",
    "revealProblems": "onProblem"
  },
},
{
  "label": "before-run-tests",
  "dependsOrder": "sequence",
  "dependsOn": [
    "remove-test-workspace-folder",
    "create-test-workspace-folder",
    "build",
    "insert-monkey-patch-allow-mocks"
  ],
  "presentation": {
    "reveal": "silent",
    "revealProblems": "onProblem"
  }
}
```

3 - On `.vscode/launch.json`, add the following within the `configurations` array:

```json
{
  "name": "Test Extension - No Workspace",
  "preLaunchTask": "before-run-tests",
  "type": "extensionHost",
  "request": "launch",
  "runtimeExecutable": "${execPath}",
  "args": [
    "/no-workspace",
    "--disable-extensions",
    "--extensionDevelopmentPath=${workspaceFolder}",
    "--extensionTestsPath=${workspaceFolder}/node_modules/.bin/vscode-tests-runner"
  ],
  "env": {
    "VSCODE_TESTS_PATH": "${workspaceFolder}/out/tests/no-workspace/"
  },
  "outFiles": ["${workspaceFolder}/out/tests/**/*.js"]
},
{
  "name": "Test Extension - With Workspace",
  "preLaunchTask": "before-run-tests",
  "postDebugTask": "remove-test-workspace-folder",
  "type": "extensionHost",
  "request": "launch",
  "runtimeExecutable": "${execPath}",
  "args": [
    "${workspaceFolder}/test-workspace",
    "--disable-extensions",
    "--extensionDevelopmentPath=${workspaceFolder}",
    "--extensionTestsPath=${workspaceFolder}/node_modules/.bin/vscode-tests-runner"
  ],
  "env": {
    "VSCODE_TESTS_PATH": "${workspaceFolder}/out/tests/with-workspace/"
  },
  "outFiles": ["${workspaceFolder}/out/tests/**/*.js"]
}
```

4 - Now, write your tests that depend on a workspace within `tests/with-workspace`. And if it doesn't need it, you can write them within `tests/no-workspace`.

Setup finished! 🎉

Now you can run the tests using VSCode:

<img height="225px" src="https://user-images.githubusercontent.com/9501115/147397085-4fc88523-0eb7-4815-a738-3511f79ac7ba.png">

### Running on CI

Running by VSCode is great for development since it's quick and can use breakpoints. But we need to do one more step to can run on CI.

1 - On `package.json`, add the following within the `scripts` object:

```json
"tests:ci:no-workspace": "vscode-electron-starter no-workspace $INIT_CWD insiders",
"tests:ci:with-workspace": "vscode-electron-starter with-workspace $INIT_CWD insiders"
```

The latest parameter is the VSCode version being used. You can use `stable`, `insiders`, or a version number (e.g., `1.32.0`)

2 - Now you can call these scripts on CI. Following, a script to run on GitHub actions:

```yaml
on:
  push:
    branches:

jobs:
  test:
    name: Test
    strategy:
      matrix:
        os: [ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: 12
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Run test - No workspace
        uses: GabrielBB/xvfb-action@v1.0
        with:
          run: npm run tests:ci:no-workspace
      - name: Run test - With workspace
        uses: GabrielBB/xvfb-action@v1.0
        with:
          run: npm run tests:ci:with-workspace
```

## Writing your first test using `jest-environment-vscode-extension`

It's almost the same idea as writing any other test using Jest, but we have a powerful API focused on VSCode.

Let's do a walkthrough writing a simple test. We want to test if the "go to the definition" works well at the second `x`:

```js
const x = 42
console.log(x)
```

1 - Firstly, our test doesn't depend on a workspace. Then we'll write it at `tests/no-workspace/definitions.test.ts`. Usually, a test depends on a workspace if it interacts with other files on the same workspace.

2 - Let's write the test itself:

```js
// get some things from the global variable `vscode`
const { Position, Range } = vscode

describe('#Definition', () => {
  it('on message interpolation', () => {
    // create a new file
    return using({
      files: {
        'index.js': dedent(`
          const x = 42
          console.log(x)
        `),
      }},
      async (mapFileToUri) => {
        // on the file `index.js`, take the definitions at 1:12 (the `x` within the `console.log`)
        const definitions = await take.definitions(mapFileToUri['index.js'], new Position(1, 12))

        // assert that it's as the expected
        expect(definitions).toHaveLength(1)
        expect(definitions[0]).toMatchObject({
          originSelectionRange: new Range(new Position(1, 12), new Position(1, 13)),
          targetRange: new Range(new Position(0, 12), new Position(0, 0)),
          targetSelectionRange: new Range(new Position(0, 6), new Position(0, 7)),
        })
      })
  })
})
```

On the above test, we used some variables injected by `jest-environment-vscode-extension`: `vscode`, `using`, `dedent`, and `take`. Think of them as the Jest's `describe` or `it`, but focused on helping you while working with VSCode.

Let's talk about them!

## API

### `using`

Our most useful function.

It creates the files and, optionally, can mock VSCode's functions. It receives a callback and, when it's finished, clear the files and mocks.

#### Files

You can create as many files as needed, and their URI is sent to the callback:

```js
using(
  {
    files: {
      'index.js': '"example";',
      'foo.js': '1;',
      'bar.js': '2;',
    },
  },
  async (mapFilenameToUri) => {
    mapFilenameToUri['index.js'] // URI
    mapFilenameToUri['foo.js']   // URI
    mapFilenameToUri['bar.js']   // URI
  }
)
```

#### Mocks

There are some VSCode features in which we can't manipulate, such as the `window.showQuickPick`. But no worries! We can easily mock it:

```js
using(
  {
    files: {
      'index.js': '"example";',
    },
    mocks: {
      'window.showQuickPick': async () => 'My Option',
    },
  },
  async (mapFilenameToUri) => {

  }
)
```

Now, if the extension calls `window.showQuickPick` it'll return `Promise<'My Option'>`.

But there is a rule to use mocks: You should ensure that the extension is initialized. For example, let's say that your extension is initialized only when there is a `.ml` file in the workspace:

```json
"activationEvents": [
  "workspaceContains:**/*.ml"
]
```

So you should run the tests using workspace and create at least one `.ml` file:

```js
using(
  {
    files: {
      'main.ml': 'let hello () = print_endline "hey there"',
    },
    mocks: {
      'window.showQuickPick': async () => 'My Option',
    },
  },
  async (mapFilenameToUri) => {

  }
)
```

### `dedent`

Function to remove indentation. Helpful with `using`.

### `vscode`

It's the same `vscode` used by the extension itself. So you can use it to manipulate the VSCode.

For example, if you want to open and show a document, you should do:

```js
const { workspace, window } = vscode

const doc = await workspace.openTextDocument(mapFileToUri['index.js'])
await window.showTextDocument(doc)
```

It doesn't export the types. If you want them, you should do:

```ts
import type { Position } from 'vscode'

const printPosition = (position: Position) => {
  console.log({
    line: position.line,
    character: position.character,
  })
}
```

### `take`

It exposes many helper functions to take values from the VSCode. Just use TypeScript's intellisense to explore what it has.

### `waitFor`

It exposes a helper function to wait for something.

For example, if your extension takes time to initialize, it can be useful:

```js
const waitForDocumentSymbols = async (uri, position) => {
  return await waitFor(async () => {
    const hovers = await take.hovers(uri, position)
    expect(hovers).toHaveLength(1)
    return hovers
  })
}

describe("#Document Symbol", () => {
  it("includes function declaration", () => {
    return using(
      {
        files: {
          'main.ml': 'let hello () = print_endline "hey there"',
        },
      },
      async (mapFilenameToUri) => {
        const symbols = await waitForDocumentSymbols(mapFilenameToUri['main.ml'])

        expect(symbols[0]).toMatchObject({
            name: 'hello',
            detail: 'unit -> unit',
        })
      }
    )
  })
})
```

## Who is using

<table align="center">
  <tr>
    <td align="center" width="50%">
      <img src="https://github.com/macabeus/vscode-fluent/raw/master/docs/featured-image.png">
      <br />
      <strong><a href="https://github.com/macabeus/vscode-fluent">vscode-fluent</a></strong>,
      extension for Fluent, the correct-by-design l10n programming language
    </td>
    <td align="center" width="50%">
      <i><a href="https://github.com/macabeus/jest-environment-vscode-extension/issues/new">Add your project here</a></i>
    </td>
  </tr>
</table>
