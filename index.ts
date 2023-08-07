import fs from 'fs/promises'
import express, { Express, Router } from 'express'

type RegisterRoutersOptions = {
	app: Express,
	paths: string[],
	dynamic: boolean,
	slug_pattern?: string,
	skip_pattern?: string
	beforeRegister?: (path: string) => void
}

/**
 * @description 
 * @param options 
 * @returns 
 */
export async function registerRouters (options: RegisterRoutersOptions): Promise<void> {
	const directories: Array<Array<string>> = []
	const routerPaths = new Set<string>

	// Grab all router paths recursively
	for (let path of options.paths) {
		path = path.replace(/^\.\//, '')
		path = path.replace(/\/$/, '')
		const stat = await fs.stat(path)
		
		// Add router path
		if (stat.isFile()) {
			routerPaths.add(`./${path}`)
			continue
		}

		// Start traversing the directories
		if (stat.isDirectory()) {
			const directory = await fs.readdir(path)
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
				const traversedPath = `./${path}/${deriveLastPathFromDirectories(directories)}`
				const stat = await fs.stat(traversedPath)

				// Add router path
				if (stat.isFile()) {
					options.beforeRegister?.(traversedPath)
					routerPaths.add(traversedPath)
					directory.pop()
					continue
				} 

				// Continue traversing the directories
				if (stat.isDirectory()) {
					directories.push(await fs.readdir(traversedPath))
					continue
				}

				// Unhandled element
				throw Error('')
			}
			continue
		}

		// Unhandled element
		throw Error('')
	}

	// Register all found routers
	for (const routerPath of routerPaths) {
		const { default: router } = await import(routerPath)
		if (typeof router !== 'function') throw Error('')
		options.app.use(router)
	}
}

/**
 * @description 
 * @param directories 
 * @returns 
 */
function deriveLastPathFromDirectories (directories: string[][]): string {
	const path: string[] = []
	for (const directory of directories) {
		if (directory.length === 0) throw Error('')
		path.push(directory[directory.length - 1])
	}
	return path.join('/')
}

