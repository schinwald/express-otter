import fs from 'fs/promises'
import { Express } from 'express'
import AutoRouter from './errors'

/**
 * Global variables
 */
let routerRelativePathBuffer: string | undefined
let routerSlugPattern: RegExp = /\[(.+)\]/g

/**
 * @description Arguments for the beforeRegister callback.
 */
type BeforeRegisterArguments = {
	/**
	 * @description Full import path of the router.
	 */
	path: string
}

/**
 * @description Arguments for the afterRegister callback.
 */
type AfterRegisterArguments = {
	/**
	 * @description Full import path of the router.
	 */
	path: string
}

/**
 * @description Options for the registerRouters function.
 */
type RegisterRoutersOptions = {
	/**
	 * @description An express app.
	 * @example
	 *	const app = express()
	 */
	app: Express,

	/**
	 * @description Base path(s) to use as the routes.
	 * @example
	 *	Given the project structure below:
	 *
	 *	root
	 *	├──dist
	 *	├──src
	 *	│  ├──middleware
	 *	│  ├──models
	 *	│  └──routes <-- base path
	 *	│     ├──pets.js
	 *	│     └──pets
	 *	│        └──[pet].js
	 *	└──tests
	 *
	 *	And the base path of './src/routes' ...
	 *	One could expect a relative path of '/pets' and '/pets/:pet'
	 */
	paths: string[]

	/**
	 * @description A global pattern for capturing slugs (params) in folders and files and using it for generating the URL {generateURL}. Only useful if you are generating URLs using dynamic routing. Must contain one capture group and a global pattern /g in order to capture all occurrences and use them when generating the URL.
	 * @default /\[(.*)\]/g
	 * @example
	 *	/\[(.*)\]/g -> captures ./pets/[pet].js
	 *	/\:(.*)/g -> captures ./pets/:pet.js
	 */
	slug_pattern?: RegExp

	/**
	 * @description A pattern for ignoring folders and files. Useful for creating helper files that are not routers.
	 * @default /^_/
	 * @example
	 *	/^_/ -> ignores ./_folder/**
	 *	/^#/ -> ignores ./#file.ts
	 */
	ignore_pattern?: RegExp

	/**
	 * @description Specifies whether to perform a dry run without registering any routes. Useful for testing purposed or for automating other operations that rely on router registration process.
	 * @default false
	 */
	dry?: boolean,

	/**
	 * @description A callback that is invoked right before a router is registered.
	 */
	beforeRegister?: ({ path }: BeforeRegisterArguments) => void

	/**
	 * @description A callback that is invoked right after a router is registered.
	 */
	afterRegister?: ({ path }: AfterRegisterArguments) => void
}

/**
 * @description Registers express routers based on the options {RegisterRoutersOptions} specified.
 * @param {RegisterRoutersOptions} options - changes the flow of the function
 * @returns {Promise<void}
 * @throws {AutoRouter.NotImplementedError}
 * @throws {AutoRouter.EmptyDirectoryError}
 * @throws {AutoRouter.ImportError}
 */
export async function registerRouters (options: RegisterRoutersOptions): Promise<void> {
	const directories: Array<Array<string>> = []
	const routerPaths: Record<string, { basePath: string, relativePath: string }> = {}

	routerSlugPattern = options.slug_pattern ?? routerSlugPattern

	// Grab all router paths recursively
	for (let basePath of new Set(options.paths)) {
		basePath = basePath.replace(/^\.\//, '')
		basePath = basePath.replace(/\/$/, '')
		const stat = await fs.stat(basePath)
		
		// Add router path
		if (stat.isFile()) {
			const relativePath = '/'
			const fullPath = `./${basePath}${relativePath}`
			routerPaths[fullPath] = {
				basePath: `./${basePath}`,
				relativePath
			}
			continue
		}

		// Start traversing the directories
		if (stat.isDirectory()) {
			const directory = await fs.readdir(basePath)
			directories.push(directory)
			
			while (directories.length > 0) {
				const directory = directories[directories.length - 1]

				// Finished traversing current directory
				if (directory.length === 0) {
					directories.pop()
					// Clean up previous directory
					if (directories.length > 0) {
						const directory = directories[directories.length - 1]
						directory.pop()
					}
					continue
				}

				// Grab the last directory element
				const relativePath = deriveLastPathFromDirectories(directories)
				const fullPath = `./${basePath}${relativePath}`
				const stat = await fs.stat(fullPath)

				// Add router path
				if (stat.isFile()) {
					const element = directory.pop() as string
					if (!/(\.ts|\.js)$/.test(element)) continue
					if ((options.ignore_pattern ?? /^_/).test(element)) continue
					routerPaths[fullPath] = {
						basePath: `./${basePath}`,
						relativePath
					}
					continue
				} 

				// Continue traversing the directories
				if (stat.isDirectory()) {
					const element = directory[directory.length - 1]
					if ((options.ignore_pattern ?? /^_/).test(element)) {
						directory.pop()
						continue
					}
					directories.push(await fs.readdir(fullPath))
					continue
				}

				// Unhandled element
				throw new AutoRouter.NotImplementedError('')
			}
			continue
		}

		// Unhandled element
		throw new AutoRouter.NotImplementedError('')
	}

	// Register all found routers
	for (const routerFullPath of Object.keys(routerPaths)) {
		// Allows generateURL to work properly
		routerRelativePathBuffer = routerPaths[routerFullPath].relativePath

		options.beforeRegister?.({
			path: routerFullPath
		})

		if (!options.dry) {
			await attemptToRegisterRouter(routerFullPath, {
				app: options.app
			})
		}

		options.afterRegister?.({
			path: routerFullPath
		})
	}
}

/**
 * @description Derives the relative path from the directories traversed.
 * @param {string[][]} directories - traversed directories
 * @returns {string} relative path
 * @throws {AutoRouter.EmptyDirectoryError}
 */
function deriveLastPathFromDirectories (directories: string[][]): string {
	const path: string[] = ['']

	for (const directory of directories) {
		if (directory.length === 0) {
			throw new AutoRouter.EmptyDirectoryError('Unable to get relative path from directories')
		}

		path.push(directory[directory.length - 1])
	}

	return path.join('/')
}

/**
 * @description Options for the attemptToRegisterRouter function.
 */
type AttemptToRegisterRouterOptions = {
	/**
	 * @description An express app.
	 * @example
	 *	const app = express()
	 */
	app: Express
}

/**
 * @description Attempts to register a router using an import path.
 * @param routerPath - path to use for import
 * @param {AttemptToRegisterRouterOptions} options - changes the flow of the function
 * @returns {Promise<void>}
 * @throws {AutoRouter.ImportError}
 */
async function attemptToRegisterRouter (routerPath: string, options: AttemptToRegisterRouterOptions): Promise<void> {
	const routerFile = (await import(routerPath)
		.catch((error) => {
			throw new AutoRouter.ImportError(`Unable to import ${routerPath}`, { cause: error })
		})) as unknown

	let router

	if (typeof routerFile !== 'object' || routerFile === null) {
		throw new AutoRouter.ImportError('Router is not an object.')
	}

	if (!('default' in routerFile)) {
		throw new AutoRouter.ImportError('Router has no default export')
	}

	router = routerFile.default

	try {
		// TODO: fix this so that there is no any
		options.app.use(router as any)
	} catch {
		throw new AutoRouter.ImportError('Not an express router.')
	}
}

/**
 * @description Generates a properly formatted URL based on its relative path. The relative path is created using the base path provided in the register router options {RegisterRouterOptions}.
 * @returns {string} url that was generated
 * @throws {AutoRouter.TypeError}
 */
export function generateURL (): string {
	if (typeof routerRelativePathBuffer !== 'string') {
		throw new AutoRouter.TypeError('Relative path of router is not a string')
	}

	routerRelativePathBuffer = routerRelativePathBuffer.replaceAll(routerSlugPattern, ':$1')
	routerRelativePathBuffer = routerRelativePathBuffer.replace(/\/index(\.ts|\.js)$/, '')
	routerRelativePathBuffer = routerRelativePathBuffer.replace(/(\.ts|\.js)$/, '')
	return routerRelativePathBuffer
}
