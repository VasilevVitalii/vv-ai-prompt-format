import { TPromtOptions, SPromtOptions, SPromtOptionsJson, defVal, defValJson, TPromtOptionsOpenAi, TPromtOptionsOllama, TPromtOptionsLlamaCpp } from './promtOptions/index.js'
import { Value } from '@sinclair/typebox/value'
export { TPromtOptions, TPromtOptionsOpenAi, TPromtOptionsOllama, TPromtOptionsLlamaCpp, SPromtOptions, SPromtOptionsJson } from './promtOptions/index.js'

export type TPromt = {
	system?: string
	user: string
	options?: TPromtOptions
	segment?: Record<string, string>
	grammar?: string
}

/**
 * Parses and validates prompt options from a raw object.
 *
 * @param use - Schema type to use: 'core' for standard AI models, 'json' for structured JSON output
 * @param raw - Raw object containing option values to parse
 * @param useAllOptions - If true, returns all options with defaults; if false, returns only specified options (default: true)
 * @returns Validated TPromtOptions object. Invalid values are replaced with defaults. Never throws errors.
 *
 * @example
 * ```typescript
 * // Get all options with defaults
 * const options = PromtOptionsParse('core', { temperature: 0.7 })
 * // Returns: { temperature: 0.7, topP: 0.9, topK: 40, ... all other defaults }
 *
 * // Get only specified options
 * const options = PromtOptionsParse('core', { temperature: 0.7 }, false)
 * // Returns: { temperature: 0.7 }
 * ```
 */
export function PromtOptionsParse(use: 'core' | 'json', raw?: object, useAllOptions: boolean = true): TPromtOptions {
	const schema = use === 'core' ? SPromtOptions : SPromtOptionsJson
	const defaults = use === 'core' ? defVal : defValJson
	const input = raw && typeof raw === 'object' ? raw : {}

	const result: TPromtOptions = {}

	for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
		const inputValue = (input as any)[key]
		const defaultValue = defaults[key]

		if (inputValue === undefined) {
			if (useAllOptions) {
				result[key] = defaultValue as any
			}
			continue
		}

		const propertySchema = (schema.properties as any)[key]
		if (propertySchema && Value.Check(propertySchema, inputValue)) {
			result[key] = inputValue
		} else {
			if (useAllOptions) {
				result[key] = defaultValue as any
			}
		}
	}

	if ((input as any).seed !== undefined) {
		const seedSchema = (schema.properties as any).seed
		if (seedSchema && Value.Check(seedSchema, (input as any).seed)) {
			result.seed = (input as any).seed
		}
	}

	return result
}

/**
 * Loads and parses prompts from a text string with structured sections.
 *
 * @param raw - Raw text string containing prompts in the format with $$begin/$$end markers
 * @param use - Schema type for options validation: 'core' for standard AI models, 'json' for structured JSON output (default: 'core')
 * @returns Array of parsed TPromt objects
 *
 * @remarks
 * Text format supports the following sections:
 * - `$$begin` / `$$end` - Marks prompt boundaries
 * - `$$system` - System message (optional)
 * - `$$user` - User message (required)
 * - `$$options` - Model parameters in key=value format (optional)
 * - `$$grammar` - JSON Schema grammar for structured output (optional)
 * - `$$segment=name` - Named content segments (optional)
 *
 * @example
 * ```typescript
 * const text = `$$begin
 * $$options
 * temperature=0.7
 * maxTokens=2048
 * $$system
 * You are a helpful assistant
 * $$user
 * Hello, world!
 * $$grammar
 * {"type": "object", "properties": {}}
 * $$end`
 *
 * const prompts = PromtLoad(text)
 * // Returns: [{ system: '...', user: '...', options: {...}, grammar: '...' }]
 * ```
 */
export function PromtLoad(raw: string, use: 'core' | 'json' = 'core'): TPromt[] {
	return parse(raw, use)
}

/**
 * Serializes prompt objects into a text string with structured sections.
 *
 * @param promt - Array of TPromt objects to serialize
 * @returns Formatted text string with $$begin/$$end markers and sections
 *
 * @remarks
 * Output format structure:
 * - Each prompt is wrapped in `$$begin` / `$$end`
 * - Sections are ordered: $$options, $$system, $$user, $$grammar, $$segment=*
 * - Options are serialized in key=value format
 * - Arrays are serialized as JSON
 * - Grammar is stored as formatted JSON Schema
 *
 * @example
 * ```typescript
 * const prompts: TPromt[] = [{
 *   system: 'You are helpful',
 *   user: 'Hello!',
 *   options: { temperature: 0.7 },
 *   grammar: '{"type": "object"}'
 * }]
 *
 * const text = PromtStore(prompts)
 * // Returns:
 * // $$begin
 * // $$options
 * // temperature=0.7
 * // $$system
 * // You are helpful
 * // $$user
 * // Hello!
 * // $$grammar
 * // {"type": "object"}
 * // $$end
 * ```
 */
export function PromtStore(promt: TPromt[]): string {
	return serialize(promt)
}

/**
 * Converts universal prompt options to OpenAI API format.
 *
 * @param options - Universal TPromtOptions object
 * @returns Options object formatted for OpenAI API with snake_case parameter names
 *
 * @remarks
 * Performs the following conversions:
 * - `topP` → `top_p`
 * - `maxTokens` → `max_tokens`
 * - `frequencyPenalty` → `frequency_penalty`
 * - `presencePenalty` → `presence_penalty`
 * - `stopSequences` → `stop` (only if non-empty)
 * - `tokenBias` → `logit_bias` (only if non-empty)
 * - Other parameters: `temperature`, `seed` (unchanged)
 *
 * @example
 * ```typescript
 * const options: TPromtOptions = {
 *   temperature: 0.7,
 *   topP: 0.9,
 *   maxTokens: 2048,
 *   frequencyPenalty: 0.5
 * }
 * const openaiOptions = ToPromtOptionsOpenAi(options)
 * // Returns: { temperature: 0.7, top_p: 0.9, max_tokens: 2048, frequency_penalty: 0.5 }
 * ```
 */
export function ToPromtOptionsOpenAi(options: TPromtOptions): TPromtOptionsOpenAi {
	const result: TPromtOptionsOpenAi = {}

	if (options.temperature !== undefined) result.temperature = options.temperature
	if (options.topP !== undefined) result.top_p = options.topP
	if (options.maxTokens !== undefined) result.max_tokens = options.maxTokens
	if (options.frequencyPenalty !== undefined) result.frequency_penalty = options.frequencyPenalty
	if (options.presencePenalty !== undefined) result.presence_penalty = options.presencePenalty
	if (options.seed !== undefined) result.seed = options.seed
	if (options.stopSequences !== undefined && options.stopSequences.length > 0) {
		result.stop = options.stopSequences
	}
	if (options.tokenBias !== undefined && Object.keys(options.tokenBias).length > 0) {
		result.logit_bias = options.tokenBias
	}

	return result
}

/**
 * Converts universal prompt options to Ollama API format.
 *
 * @param options - Universal TPromtOptions object
 * @returns Options object formatted for Ollama API with snake_case parameter names
 *
 * @remarks
 * Performs the following conversions:
 * - `topP` → `top_p`
 * - `topK` → `top_k`
 * - `minP` → `min_p`
 * - `maxTokens` → `num_predict`
 * - `repeatPenalty` → `repeat_penalty`
 * - `repeatPenaltyNum` → `repeat_last_n`
 * - `mirostatTau` → `mirostat_tau`
 * - `mirostatEta` → `mirostat_eta`
 * - `stopSequences` → `stop` (only if non-empty)
 * - `penalizeNewline` → `penalize_newline`
 * - Other parameters: `temperature`, `mirostat`, `seed` (unchanged)
 *
 * @example
 * ```typescript
 * const options: TPromtOptions = {
 *   temperature: 0.8,
 *   topK: 40,
 *   maxTokens: 512,
 *   mirostat: 2,
 *   mirostatTau: 5.0
 * }
 * const ollamaOptions = ToPromtOptionsOllama(options)
 * // Returns: { temperature: 0.8, top_k: 40, num_predict: 512, mirostat: 2, mirostat_tau: 5.0 }
 * ```
 */
export function ToPromtOptionsOllama(options: TPromtOptions): TPromtOptionsOllama {
	const result: TPromtOptionsOllama = {}

	if (options.temperature !== undefined) result.temperature = options.temperature
	if (options.topP !== undefined) result.top_p = options.topP
	if (options.topK !== undefined) result.top_k = options.topK
	if (options.minP !== undefined) result.min_p = options.minP
	if (options.maxTokens !== undefined) result.num_predict = options.maxTokens
	if (options.repeatPenalty !== undefined) result.repeat_penalty = options.repeatPenalty
	if (options.repeatPenaltyNum !== undefined) result.repeat_last_n = options.repeatPenaltyNum
	if (options.mirostat !== undefined) result.mirostat = options.mirostat
	if (options.mirostatTau !== undefined) result.mirostat_tau = options.mirostatTau
	if (options.mirostatEta !== undefined) result.mirostat_eta = options.mirostatEta
	if (options.seed !== undefined) result.seed = options.seed
	if (options.stopSequences !== undefined && options.stopSequences.length > 0) {
		result.stop = options.stopSequences
	}
	if (options.penalizeNewline !== undefined) result.penalize_newline = options.penalizeNewline

	return result
}

/**
 * Converts universal prompt options to node-llama-cpp API format.
 *
 * @param options - Universal TPromtOptions object
 * @returns Options object formatted for node-llama-cpp API with camelCase parameter names
 *
 * @remarks
 * Performs the following conversions:
 * - `trimWhitespace` → `trimWhitespaceSuffix`
 * - `stopSequences` → `customStopTriggers` (only if non-empty)
 * - `tokenBias` → `tokenBias` (only if non-empty)
 * - Combines multiple penalty parameters into `repeatPenalty` object:
 *   - `repeatPenalty` → `repeatPenalty.penalty`
 *   - `repeatPenaltyNum` → `repeatPenalty.lastTokens`
 *   - `frequencyPenalty` → `repeatPenalty.frequencyPenalty`
 *   - `presencePenalty` → `repeatPenalty.presencePenalty`
 *   - `penalizeNewline` → `repeatPenalty.penalizeNewLine`
 * - Other parameters remain in camelCase: `temperature`, `topP`, `topK`, `minP`, `maxTokens`, `seed`, `evaluationPriority`, `contextShiftSize`, `disableContextShift`
 *
 * @example
 * ```typescript
 * const options: TPromtOptions = {
 *   temperature: 0.7,
 *   topP: 0.9,
 *   maxTokens: 1024,
 *   repeatPenalty: 1.1,
 *   repeatPenaltyNum: 64,
 *   frequencyPenalty: 0.5
 * }
 * const llamaCppOptions = ToPromtOptionsLlamaCpp(options)
 * // Returns: {
 * //   temperature: 0.7,
 * //   topP: 0.9,
 * //   maxTokens: 1024,
 * //   repeatPenalty: {
 * //     penalty: 1.1,
 * //     lastTokens: 64,
 * //     frequencyPenalty: 0.5
 * //   }
 * // }
 * ```
 */
export function ToPromtOptionsLlamaCpp(options: TPromtOptions): TPromtOptionsLlamaCpp {
	const result: TPromtOptionsLlamaCpp = {}

	if (options.temperature !== undefined) result.temperature = options.temperature
	if (options.topP !== undefined) result.topP = options.topP
	if (options.topK !== undefined) result.topK = options.topK
	if (options.minP !== undefined) result.minP = options.minP
	if (options.maxTokens !== undefined) result.maxTokens = options.maxTokens
	if (options.seed !== undefined) result.seed = options.seed
	if (options.trimWhitespace !== undefined) result.trimWhitespaceSuffix = options.trimWhitespace
	if (options.stopSequences !== undefined && options.stopSequences.length > 0) {
		result.customStopTriggers = options.stopSequences
	}
	if (options.tokenBias !== undefined && Object.keys(options.tokenBias).length > 0) {
		result.tokenBias = options.tokenBias
	}
	if (options.evaluationPriority !== undefined) result.evaluationPriority = options.evaluationPriority
	if (options.contextShiftSize !== undefined) result.contextShiftSize = options.contextShiftSize
	if (options.disableContextShift !== undefined) result.disableContextShift = options.disableContextShift

	const hasRepeatPenalty = options.repeatPenalty !== undefined ||
		options.repeatPenaltyNum !== undefined ||
		options.frequencyPenalty !== undefined ||
		options.presencePenalty !== undefined ||
		options.penalizeNewline !== undefined

	if (hasRepeatPenalty) {
		result.repeatPenalty = {
			...(options.repeatPenalty !== undefined && { penalty: options.repeatPenalty }),
			...(options.repeatPenaltyNum !== undefined && { lastTokens: options.repeatPenaltyNum }),
			...(options.frequencyPenalty !== undefined && { frequencyPenalty: options.frequencyPenalty }),
			...(options.presencePenalty !== undefined && { presencePenalty: options.presencePenalty }),
			...(options.penalizeNewline !== undefined && { penalizeNewLine: options.penalizeNewline }),
		}
	}

	return result
}

/**
 * Validates JSON Schema grammar string.
 *
 * @param raw - JSON Schema grammar string to validate
 * @returns Validated and formatted JSON Schema string, or empty string if invalid
 *
 * @remarks
 * This function:
 * - Parses the JSON string to verify it's valid JSON
 * - Returns formatted JSON string if valid
 * - Returns empty string if parsing fails or input is empty
 *
 * @example
 * ```typescript
 * const grammar = GrammarCheck('{"type": "object", "properties": {}}')
 * // Returns: '{\n  "type": "object",\n  "properties": {}\n}'
 *
 * const invalid = GrammarCheck('invalid json')
 * // Returns: ''
 * ```
 */
export function GrammarCheck(raw: string): string {
	if (!raw || raw.trim() === '') {
		return ''
	}

	try {
		const parsed = JSON.parse(raw)
		return JSON.stringify(parsed, null, 2)
	} catch {
		return ''
	}
}

function parse(content: string, use: 'core' | 'json'): TPromt[] {
	const lines = content.split('\n')
	const promts: TPromt[] = []

	let inBlock = false
	let currentPromt: Partial<TPromt> | null = null
	let currentSection: 'system' | 'user' | 'segment' | 'options' | 'grammar' | null = null
	let currentSegmentName: string | null = null
	let sectionContent: string[] = []

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const trimmed = line.trim()

		if (trimmed === '$$begin') {
			if (inBlock && currentPromt) {
				if (currentSection && sectionContent.length > 0) {
					finishSection(currentPromt, currentSection, sectionContent, use, currentSegmentName)
				}
				if (currentPromt.user) {
					promts.push(currentPromt as TPromt)
				}
			}
			inBlock = true
			currentPromt = {}
			currentSection = null
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$end') {
			if (inBlock && currentPromt) {
				if (currentSection && sectionContent.length > 0) {
					finishSection(currentPromt, currentSection, sectionContent, use, currentSegmentName)
				}
				if (currentPromt.user) {
					promts.push(currentPromt as TPromt)
				}
			}
			inBlock = false
			currentPromt = null
			currentSection = null
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (!inBlock || !currentPromt) {
			continue
		}

		if (trimmed === '$$system') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPromt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'system'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$user') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPromt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'user'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$options') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPromt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'options'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$grammar') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPromt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'grammar'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed.startsWith('$$segment=')) {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPromt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'segment'
			currentSegmentName = trimmed.substring('$$segment='.length).trim()
			sectionContent = []
			continue
		}

		if (currentSection) {
			sectionContent.push(line)
		}
	}

	if (inBlock && currentPromt) {
		if (currentSection && sectionContent.length > 0) {
			finishSection(currentPromt, currentSection, sectionContent, use, currentSegmentName)
		}
		if (currentPromt.user) {
			promts.push(currentPromt as TPromt)
		}
	}

	return promts
}

function finishSection(promt: Partial<TPromt>, section: 'system' | 'user' | 'segment' | 'options' | 'grammar', lines: string[], use: 'core' | 'json', segmentName?: string | null): void {
	const content = lines.join('\n').trim()
	if (section === 'system') {
		promt.system = content
	} else if (section === 'user') {
		promt.user = content
	} else if (section === 'segment' && segmentName) {
		if (!promt.segment) {
			promt.segment = {}
		}
		promt.segment[segmentName] = content
	} else if (section === 'options') {
		const rawOptions = parseOptionsToObject(content)
		promt.options = PromtOptionsParse(use, rawOptions, false)
	} else if (section === 'grammar') {
		const validated = GrammarCheck(content)
		if (validated) {
			promt.grammar = validated
		}
	}
}

function parseOptionsToObject(content: string): Record<string, any> {
	const options: Record<string, any> = {}
	const lines = content.split('\n')

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed) continue

		const eqIndex = trimmed.indexOf('=')
		if (eqIndex <= 0) continue

		const key = trimmed.substring(0, eqIndex).trim()
		const valueStr = trimmed.substring(eqIndex + 1).trim()

		const value = parseOptionValue(valueStr)
		if (value !== undefined) {
			options[key] = value
		}
	}

	return options
}

function parseOptionValue(valueStr: string): number | boolean | string[] | undefined {
	// Пустое значение = undefined
	if (valueStr === '') {
		return undefined
	}

	// Убираем кавычки если есть
	let cleanValue = valueStr
	if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
		cleanValue = cleanValue.slice(1, -1)
	}

	// Пробуем распарсить как JSON (для массивов)
	if (valueStr.startsWith('[')) {
		try {
			const parsed = JSON.parse(valueStr)
			if (Array.isArray(parsed)) {
				return parsed
			}
		} catch {
			// Игнорируем ошибку, попробуем другие варианты
		}
	}

	// Boolean значения
	const lower = cleanValue.toLowerCase()
	if (lower === 'true' || lower === '1' || lower === 'y') return true
	if (lower === 'false' || lower === '0' || lower === 'n') return false

	// Числовые значения - заменяем запятую на точку
	const numValue = cleanValue.replace(',', '.')
	const parsed = parseFloat(numValue)
	if (!isNaN(parsed)) {
		return parsed
	}

	return undefined
}

function serialize(promts: TPromt[]): string {
	const result: string[] = []

	for (const promt of promts) {
		result.push('$$begin')

		if (promt.options) {
			result.push('$$options')
			for (const [key, value] of Object.entries(promt.options)) {
				result.push(serializeOptionValue(key as keyof TPromtOptions, value))
			}
		}

		if (promt.system) {
			result.push('$$system')
			result.push(promt.system)
		}

		result.push('$$user')
		result.push(promt.user)

		if (promt.grammar) {
			result.push('$$grammar')
			result.push(promt.grammar)
		}

		if (promt.segment) {
			for (const [key, value] of Object.entries(promt.segment)) {
				result.push(`$$segment=${key}`)
				result.push(value)
			}
		}

		result.push('$$end')
	}

	return result.join('\n')
}

function serializeOptionValue(key: keyof TPromtOptions, value: any): string {
	if (value === undefined) {
		return `${key}=`
	}

	if (Array.isArray(value)) {
		return `${key}=${JSON.stringify(value)}`
	}

	return `${key}=${value}`
}
