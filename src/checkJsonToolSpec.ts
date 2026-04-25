import { Ajv } from 'ajv'

/**
 * Validates a tool spec string when it is expected to be a JSON Schema.
 *
 * @param raw - Tool spec string to validate
 * @returns `undefined` if spec is valid, error message string if invalid
 *
 * @remarks
 * This function:
 * - Returns `undefined` for empty or missing input
 * - Parses the string to verify it's valid JSON
 * - Validates the schema structure using AJV
 * - Requires the root type to be "object" (tool parameters are always an object)
 *
 * @example
 * ```typescript
 * const result1 = CheckJsonToolSpec('{"type":"object","properties":{"query":{"type":"string"}}}')
 * // Returns: undefined (valid)
 *
 * const result2 = CheckJsonToolSpec('{"type":"string"}')
 * // Returns: error message (root type must be "object")
 *
 * const result3 = CheckJsonToolSpec('invalid json')
 * // Returns: error message (invalid JSON)
 *
 * const result4 = CheckJsonToolSpec(undefined)
 * // Returns: undefined (empty input)
 * ```
 */
export function CheckJsonToolSpec(raw: string | undefined): string | undefined {
	if (!raw || raw.trim() === '') {
		return undefined
	}

	let json: unknown
	try {
		json = JSON.parse(raw)
	} catch (err) {
		return `${err}`
	}

	if (typeof json !== 'object' || json === null || Array.isArray(json)) {
		return 'tool spec must be a JSON object'
	}

	const root = json as Record<string, unknown>
	if (root['type'] !== 'object') {
		return 'tool spec root type must be "object"'
	}

	try {
		const ajv = new Ajv({ strict: false, allErrors: true })
		ajv.compile(json)
		return undefined
	} catch (err) {
		return `${err}`
	}
}
