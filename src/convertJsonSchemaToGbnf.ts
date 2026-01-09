/**
 * Converts JSON Schema to GBNF (Grammar BNF) format for node-llama-cpp.
 *
 * @param schema - JSON Schema object to convert
 * @returns Object with either `error` string or `result` containing converted GBNF grammar
 *
 * @remarks
 * This function converts JSON Schema to GBNF format used by node-llama-cpp for structured output.
 *
 * Supported JSON Schema types:
 * - `object` with `properties` and `additionalProperties`
 * - `array` with `items`
 * - Primitive types: `string`, `number`, `integer`, `boolean`, `null`
 * - `enum` for enumerated values
 * - `const` for constant values
 *
 * The function returns a discriminated union:
 * - On success: `{ result: any }` - contains the converted GBNF grammar object
 * - On error: `{ error: string }` - contains the error message
 *
 * @example
 * ```typescript
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'integer' }
 *   }
 * }
 *
 * const result = ConvertJsonSchemaToGbnf(schema)
 * if ('result' in result) {
 *   console.log(result.result) // GBNF grammar object
 * } else {
 *   console.error(result.error) // Error message
 * }
 * ```
 */
export function ConvertJsonSchemaToGbnf(schema: any): { error: string } | { result: any } {
	try {
		const converted = convertJsonSchemaToGbnfInternal(schema)
		return { result: converted }
	} catch (err) {
		return { error: `${err}` }
	}
}

function convertJsonSchemaToGbnfInternal(schema: any): any {
	if (schema.type === 'array' && schema.items) {
		return {
			type: 'array' as const,
			items: convertJsonSchemaToGbnfInternal(schema.items),
		}
	}
	if (schema.type === 'object' && schema.properties) {
		const properties: Record<string, any> = {}
		for (const [key, value] of Object.entries(schema.properties)) {
			properties[key] = convertJsonSchemaToGbnfInternal(value as any)
		}

		return {
			type: 'object' as const,
			properties,
			additionalProperties: schema.additionalProperties === true ? true : false,
		}
	}
	if (schema.type === 'string') {
		return { type: 'string' as const }
	}
	if (schema.type === 'number') {
		return { type: 'number' as const }
	}
	if (schema.type === 'integer') {
		return { type: 'integer' as const }
	}
	if (schema.type === 'boolean') {
		return { type: 'boolean' as const }
	}
	if (schema.type === 'null') {
		return { type: 'null' as const }
	}
	if (schema.enum) {
		return { enum: schema.enum as readonly (string | number | boolean | null)[] }
	}
	if (schema.const !== undefined) {
		return { const: schema.const }
	}
	throw new Error(`Unsupported JSON Schema format: ${JSON.stringify(schema)}`)
}
