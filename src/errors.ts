/**
 * @classdesc A generic error class
 * @extends {Error}
 */
class GenericError extends Error {
	constructor (message?: string) {
		super(message)
		this.name = 'GenericError'
	}
}

/**
 * @classdesc An error class for incorrect types
 * @extends {GenericError}
 */
class TypeError extends GenericError {
	constructor (message?: string) {
		super(message)
		this.name = 'TypeError'
	}
}

/**
 * @classdesc An error class for import failures
 * @extends {GenericError}
 */
class ImportError extends GenericError {
	constructor (message?: string) {
		super(message)
		this.name = 'ImportError'
	}
}

/**
 * @classdesc An error class for when a directory is empty and cannot be used
 * @extends {GenericError}
 */
class EmptyDirectoryError extends GenericError {
	constructor (message?: string) {
		super(message)
		this.name = 'EmptyDirectoryError'
	}
}

/**
 * @classdesc An error class for invalid paths
 * @extends {GenericError}
 */
class PathError extends GenericError {
	constructor (message?: string) {
		super(message)
		this.name = 'PathError'
	}
}

/**
 * @classdesc An error class for unimplemented flows
 * @extends {GenericError}
 */
class NotImplementedError extends GenericError {
	constructor (message?: string) {
		super(message)
		this.name = 'NotImplementedError'
	}
}

/**
 * Export all errors together
 */
export default {
	GenericError,
	TypeError,
	ImportError,
	EmptyDirectoryError,
	PathError,
	NotImplementedError
}
