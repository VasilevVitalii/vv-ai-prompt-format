import { TPrompt, TPromptOptions } from './index.js'

/**
 * Serializes prompt objects into a text string with structured sections.
 *
 * @param prompt - Array of TPrompt objects to serialize
 * @returns Formatted text string with $$begin/$$end markers and sections
 *
 * @remarks
 * Output format structure:
 * - Each prompt is wrapped in `$$begin` / `$$end`
 * - Sections are ordered: $$llm, $$options, $$system, $$user, $$jsonresponse, $$segment=*
 * - LLM config is serialized in key=value format (url and model)
 * - Options are serialized in key=value format
 * - Arrays and objects are serialized as JSON
 * - JSON response schema is stored as formatted JSON Schema
 *
 * @example
 * ```typescript
 * const prompts: TPrompt[] = [{
 *   system: 'You are helpful',
 *   user: 'Hello!',
 *   options: { temperature: 0.7 },
 *   jsonresponse: '{"type": "object"}'
 * }]
 *
 * const text = PromptConvToString(prompts)
 * // Returns:
 * // $$begin
 * // $$options
 * // temperature=0.7
 * // $$system
 * // You are helpful
 * // $$user
 * // Hello!
 * // $$jsonresponse
 * // {"type": "object"}
 * // $$end
 * ```
 */
export function PromptConvToString(prompt: TPrompt[]): string {
	return serialize(prompt)
}

function serialize(prompts: TPrompt[]): string {
	const result: string[] = []

	for (const prompt of prompts) {
		result.push('$$begin')

		if (prompt.llm) {
			result.push('$$llm')
			if (prompt.llm.url !== undefined) {
				result.push(`url=${prompt.llm.url}`)
			}
			if (prompt.llm.model !== undefined) {
				result.push(`model=${prompt.llm.model}`)
			}
			if (prompt.llm.gpulayer !== undefined) {
				result.push(`gpulayer=${prompt.llm.gpulayer}`)
			}
		}

		if (prompt.options) {
			result.push('$$options')
			for (const [key, value] of Object.entries(prompt.options)) {
				result.push(serializeOptionValue(key as keyof TPromptOptions, value))
			}
		}

		if (prompt.system) {
			result.push('$$system')
			result.push(prompt.system)
		}

		result.push('$$user')
		result.push(prompt.user)

		if (prompt.jsonresponse) {
			result.push('$$jsonresponse')
			result.push(prompt.jsonresponse)
		}

		if (prompt.segment) {
			for (const [key, value] of Object.entries(prompt.segment)) {
				result.push(`$$segment=${key}`)
				result.push(value)
			}
		}

		if (prompt.tool && prompt.tool.length > 0) {
			result.push('$$tool')
			result.push(prompt.tool.map(t => t.name).join('\n'))
			for (const tool of prompt.tool) {
				if (tool.spec) {
					result.push(`$$tool=spec=${tool.name}`)
					result.push(tool.spec)
				}
			}
			for (const tool of prompt.tool) {
				if (tool.lang && tool.code !== undefined) {
					result.push(`$$tool=${tool.lang}=${tool.name}`)
					result.push(tool.code)
				}
			}
		}

		result.push('$$end')
	}

	return result.join('\n')
}

function serializeOptionValue(key: keyof TPromptOptions, value: any): string {
	if (value === undefined) {
		return `${key}=`
	}

	if (Array.isArray(value)) {
		return `${key}=${JSON.stringify(value)}`
	}

	if (typeof value === 'object' && value !== null) {
		return `${key}=${JSON.stringify(value)}`
	}

	return `${key}=${value}`
}
