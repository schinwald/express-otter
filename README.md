# Express Otter

![A picture of an otter.](./logo.png)

A lightning fast :zap: automatic router-registration solution for express applications.

*(Built with extensibility in mind)*

### :wave: Introduction

Automatically crawls your project in order to register routers to your express application. You can use this on older express projects or newer ones. Create static routes if you prefer managing your routes with code or create dynamic routes if you prefer a more modern approach.

Dynamic routing has become more and more popular lately --- and with so many benefits, why wouldn't it be?

It has:
- A single source of truth for defining your routes
- A visual representation of your routes
- An easy way to change your routes when refactoring

### :inbox_tray: Installation

```bash
npm install express-otter
```

### :telescope: Usage

Given a project structure like so....


#### Dynamic Routing (Recommended)

Dynamic routing uses the project structure to define router URLs.

```
root
├──dist
├──src
│  ├──middleware
│  ├──models
│  ├──routes <-------------- base path
│  │  └──pets
│  │     └──[pet].js <------ router
│  └──utils
└──tests
```

```javascript
/** ./app.js */

import express from 'express'
import { registerRouters } from 'express-otter'

const app = express()

/** Register routers after initializing the app */
await registerRouters({
    app,
    paths: ['./src/routes'] // Points to the routes directory
})

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000')
})
```

```javascript
/** ./src/routes/pets/[pets].js */

import express from 'express'
import { generateURL } from 'express-otter'

/** Used to generate the URL when registering routes */
const url = generateURL()
// '/pets/:pets'

const router = express.Router()

/** Router will automatically be registered */
router.get(url, (req, res) => {
    res.send('You have reached this endpoint!')
})

export default router
```

```javascript
const response = await fetch('http://localhost:3000/pets/dog')
    .then(response => response.text())

console.log(response)
// 'You have reached this endpoint!'
```

#### Static Routing

Static routing uses the code to defined router URLs.

```
root
├──dist
├──src
│  ├──middleware
│  ├──models
│  ├──routes <-------------- base path
│  │  └──cars.js <---------- router
│  └──utils
└──tests
```

```javascript
/** ./app.js */

import express from 'express'
import { registerRouters } from 'express-otter'

const app = express()

/** Register routers after initializing the app */
await registerRouters({
    app,
    paths: ['./src/routes'] // Points to the routes directory
})

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000')
})
```

```javascript
/** ./src/routes/cars.js */

import express from 'express'

const router = express.Router()

/** Router will automatically be registered */
router.get('/cars/toyota/:model', (req, res) => {
    res.send('You have reached this endpoint!')
})

export default router
```

```javascript
const response = await fetch('http://localhost:3000/pets/dog')
    .then(response => response.text())

console.log(response)
// 'You have reached this endpoint!'
```

### :book: Documentation

#### registerRouters (options: RegisterRoutersOptions): void

Recursively registers routes given the options below as a guideline.

##### RegisterRoutersOptions

| Property       | Type       | Default       | Description                                                   |
|----------------|------------|---------------|---------------------------------------------------------------|
| app            | `Express`  |               | An express app.                                               |
| paths          | `string[]` |               | Defines the base path(s) when looking for routers.            |
| slugPattern    | `RegExp`   | `/\[(.+)\]/g` | A **global** pattern for capturing slugs in files/folders.    |
| ignorePattern  | `RegExp`   | `/^_/`        | A pattern for ignoring files/folders.                         |
| beforeRegister | `function` |               | A callback that is invoked right before registering a router. |
| afterRegister  | `function` |               | A callback that is invoked right after registering a router.  |
| dry            | `boolean`  | `false`       | Specifies whether to perform a dry run.                       |

#### generateURL (): string

Generates a URL for assigning it to a router (*dynamic routing only*).

#### Debugging

##### Flags

*EXPRESS_OTTER_DEBUG*

Useful for checking what could be going on under the water :ocean: (*hehe*). Sometimes assumptions on the paths can be incorrect so this can give some insights on what might need to change. Below is an example of how to use it.

```bash
EXPRESS_OTTER_DEBUG=true node index.js
```

### :test_tube: Developement

#### Roadmap

- [x] Routing for static & dynamic strategies
- [x] Support CommonJS and ESM
- [x] Flexible slug & ignore patterns
- [x] Hooks for beforeRegister & afterRegister
- [x] Debug mode
- [ ] Add WebSocket support
- [ ] Create plugin capabilities

