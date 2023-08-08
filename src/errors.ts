/**
 * @classdesc A generic error class
 * @extends {Error}
 */
class GenericError extends Error {
	constructor (message?: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'GenericError'
	}
}

/**
 * @classdesc 
 * @extends {GenericError}
 */
class TypeError extends GenericError {
	constructor (message?: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'TypeError'
	}
}

/**
 * @classdesc 
 * @extends {GenericError}
 */
class ImportError extends GenericError {
	constructor (message?: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'ImportError'
	}
}

/**
 * @classdesc 
 * @extends {GenericError}
 */
class EmptyDirectoryError extends GenericError {
	constructor (message?: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'EmptyDirectoryError'
	}
}

/**
 * @classdesc 
 * @extends {GenericError}
 */
class NotImplementedError extends GenericError {

	/**
	 * @description Creates an instance of the class
	 */
	constructor (message?: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'NotImplementedError'
	}
}

/**
 * 
 */
export default {
	GenericError,
	TypeError,
	ImportError,
	EmptyDirectoryError,
	NotImplementedError
}
