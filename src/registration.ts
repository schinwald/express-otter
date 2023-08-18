import fs from 'fs/promises'
import { Express } from 'express'
import Otter from './errors'
import path from 'path'
import pino from 'pino'

const logger = pino({
	transport: {
		target: 'pino-pretty'
	},
	enabled: process.env.EXPRESS_OTTER_DEBUG === 'true' ? true : false
})

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
	slugPattern?: RegExp

	/**
	 * @description A pattern for ignoring folders and files. Useful for creating helper files that are not routers.
	 * @default /^_/
	 * @example
	 *	/^_/ -> ignores ./_folder/**
	 *	/^#/ -> ignores ./#file.ts
	 */
	ignorePattern?: RegExp

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
 * @throws {Otter.NotImplementedError}
 * @throws {Otter.EmptyDirectoryError}
 * @throws {Otter.ImportError}
 * @throws {Otter.PathError}
 */
export async function registerRouters (options: RegisterRoutersOptions): Promise<void> {
	const directories: Array<Array<string>> = []
	const routerPaths: Record<string, { basePath: string, relativePath: string }> = {}

	routerSlugPattern = options.slugPattern ?? routerSlugPattern

	logger.info('Scanning paths to find routers')

	// Grab all router paths recursively
	for (let basePath of new Set(options.paths)) {
		basePath = basePath.replace(/^\.\//, '')
		basePath = basePath.replace(/\/$/, '')

		const absolutePath = path.resolve(path.dirname(process.argv[1]), basePath)

		let stat
		try {
			stat = await fs.stat(absolutePath)
		} catch (error) {
			logger.error({
				msg: 'Unable to get stats',
				err: error
			})
			throw new Otter.PathError('Unable to get stats.')
		}

		// Add router path
		if (stat.isFile()) {
			const relativePath = ''
			const fullPath = [absolutePath, relativePath].join('/')
			routerPaths[fullPath] = {
				basePath,
				relativePath
			}
			continue
		}

		// Start traversing the directories
		if (stat.isDirectory()) {
			let directory
			try {
				directory = await fs.readdir(absolutePath)
			} catch (error) {
				logger.error({
					msg: 'Unable to read directory',
					err: error
				})
				throw new Otter.PathError('Unable to read directory.')
			}

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
				const fullPath = [absolutePath, relativePath].join('/')

				let stat
				try {
					stat = await fs.stat(fullPath)
				} catch (error) {
					logger.error({
						msg: 'Unable to get stats',
						err: error
					})
					throw new Otter.PathError('Unable to get stats.')
				}

				// Add router path
				if (stat.isFile()) {
					const element = directory.pop() as string
					if (!/(\.ts|\.js)$/.test(element)) continue
					if ((options.ignorePattern ?? /^_/).test(element)) continue
					routerPaths[fullPath] = {
						basePath,
						relativePath
					}
					continue
				} 

				// Continue traversing the directories
				if (stat.isDirectory()) {
					const element = directory[directory.length - 1]
					if ((options.ignorePattern ?? /^_/).test(element)) {
						directory.pop()
						continue
					}

					try {
						directories.push(await fs.readdir(fullPath))
					} catch (error) {
						logger.error({
							msg: 'Unable to read directory',
							err: error
						})
						throw new Otter.PathError('Unable to read directory.')
					}
					continue
				}

				// Unhandled element
				logger.error({
					msg: 'Only files and folders are handled',
					obj: { fullPath }
				})
				throw new Otter.NotImplementedError('Unable to decypher file/folder type.')
			}
			continue
		}

		// Unhandled element
		logger.error({
			msg: 'Only files and folders are handled',
			obj: { absolutePath }
		})
		throw new Otter.NotImplementedError('Unable to decypher file/folder type.')
	}

	// Register all found routers
	for (const routerFullPath of Object.keys(routerPaths)) {
		logger.info({
			msg: 'Attempting to register router',
			obj: {
				fullPath: routerFullPath,
				basePath: routerPaths[routerFullPath].basePath,
				relativePath: routerPaths[routerFullPath].relativePath
			}
		})

		// Allows generateURL to work properly
		routerRelativePathBuffer = routerPaths[routerFullPath].relativePath

		logger.info('Before registering fired')

		options.beforeRegister?.({
			path: routerFullPath
		})

		if (!options.dry) {
			await attemptToRegisterRouter(routerFullPath, {
				app: options.app
			})
		}

		logger.info('After registering hook fired')

		options.afterRegister?.({
			path: routerFullPath
		})
	}

	logger.info('Successfully registered all routers')
}

/**
 * @description Derives the relative path from the directories traversed.
 * @param {string[][]} directories - traversed directories
 * @returns {string} relative path
 * @throws {Otter.EmptyDirectoryError}
 */
function deriveLastPathFromDirectories (directories: string[][]): string {
	const path: string[] = []

	for (const directory of directories) {
		if (directory.length === 0) {
			logger.error('Length of directory is zero')
			throw new Otter.EmptyDirectoryError('Unable to get relative path from directories')
		}

		path.push(directory[directory.length - 1])
	}

	const derived = path.join('/')
	
	logger.info({
		msg: 'Derivded relative path from directories',
		obj: { derived }
	})

	return derived
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
 * @throws {Otter.ImportError}
 */
async function attemptToRegisterRouter (routerPath: string, options: AttemptToRegisterRouterOptions): Promise<void> {
	const routerFile = (await import(routerPath)
		.catch((error) => {
			logger.error({
				msg: 'Something went wrong while importing',
				err: error
			})
			throw new Otter.ImportError(`Unable to import ${routerPath}.`)
		})) as unknown

	let router: any

	if (typeof routerFile !== 'object' || routerFile === null) {
		logger.error('Imported router is not an object or is equal to null')
		throw new Otter.ImportError('Router is not an object.')
	}

	if (!('default' in routerFile)) {
		logger.error('Imported router has no default member')
		throw new Otter.ImportError('Router has no default export.')
	}

	router = routerFile.default

	try {
		// TODO: fix this so that there is no any
		options.app.use(router)
	} catch {
		logger.error('Failed to use router in express')
		throw new Otter.ImportError('Not an express router.')
	}

	logger.info({
		msg: 'Registered router',
		obj: { routerPath }
	})
}

/**
 * @description Generates a properly formatted URL based on its relative path. The relative path is created using the base path provided in the register router options {RegisterRouterOptions}.
 * @returns {string} url that was generated
 * @throws {Otter.TypeError}
 */
export function generateURL (): string {
	if (typeof routerRelativePathBuffer !== 'string') {
		logger.error('Relative path of router is not a string')
		throw new Otter.TypeError('Relative path of router is not a string.')
	}

	const before = routerRelativePathBuffer

	routerRelativePathBuffer = routerRelativePathBuffer.replace(routerSlugPattern, ':$1')
	routerRelativePathBuffer = routerRelativePathBuffer.replace(/\/index(\.ts|\.js)$/, '')
	routerRelativePathBuffer = routerRelativePathBuffer.replace(/index(\.ts|\.js)$/, '')
	routerRelativePathBuffer = routerRelativePathBuffer.replace(/(\.ts|\.js)$/, '')
	routerRelativePathBuffer = `/${routerRelativePathBuffer}`

	const after = routerRelativePathBuffer

	logger.info({
		msg: 'Generated URL',
		obj: { before, after }
	})

	return routerRelativePathBuffer
}
