import { TPromtOptions, TPromtOptionsOpenAi, TPromtOptionsOllama, TPromtOptionsLlamaCpp } from './promtOptions/index.js'
import { CheckJsonSchema } from './checkJsonSchema.js'
import { ConvertJsonSchemaToGbnf } from './convertJsonSchemaToGbnf.js'

/**
 * Converts universal prompt options to OpenAI API format.
 *
 * @param options - Universal TPromtOptions object
 * @param response_format - Optional JSON Schema grammar string for structured output via OpenAI response_format
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
 * - If `response_format` parameter is provided and valid JSON Schema, creates OpenAI `response_format` object
 * - Invalid or empty `response_format` is ignored
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
 * const response_format = '{"type": "object", "properties": {"name": {"type": "string"}}}'
 * const openaiOptions = ToPromtOptionsOpenAi(options, response_format)
 * // Returns: {
 * //   temperature: 0.7,
 * //   top_p: 0.9,
 * //   max_tokens: 2048,
 * //   frequency_penalty: 0.5,
 * //   response_format: {
 * //     type: "json_schema",
 * //     json_schema: {
 * //       name: "response",
 * //       strict: true,
 * //       schema: { type: "object", properties: { name: { type: "string" } } }
 * //     }
 * //   }
 * // }
 * ```
 */
export function ToPromtOptionsOpenAi(options: TPromtOptions, response_format?: string): TPromtOptionsOpenAi {
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

	if (response_format) {
		const validationError = CheckJsonSchema(response_format)
		if (!validationError) {
			try {
				const schema = JSON.parse(response_format)
				result.response_format = {
					type: 'json_schema',
					json_schema: {
						name: 'response',
						strict: true,
						schema: schema
					}
				}
			} catch {
				// Ignore response_format if parsing fails
			}
		}
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
 * @param grammar - Optional JSON Schema grammar string to convert to GBNF format
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
 * - If `grammar` parameter is provided, converts JSON Schema to GBNF format
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
 * const grammar = '{"type": "object", "properties": {"name": {"type": "string"}}}'
 * const llamaCppOptions = ToPromtOptionsLlamaCpp(options, grammar)
 * // Returns: {
 * //   temperature: 0.7,
 * //   topP: 0.9,
 * //   maxTokens: 1024,
 * //   repeatPenalty: {
 * //     penalty: 1.1,
 * //     lastTokens: 64,
 * //     frequencyPenalty: 0.5
 * //   },
 * //   grammar: { type: 'object', properties: { name: { type: 'string' } } }
 * // }
 * ```
 */
export function ToPromtOptionsLlamaCpp(options: TPromtOptions, grammar?: string): TPromtOptionsLlamaCpp {
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

	if (grammar) {
		try {
			const schema = JSON.parse(grammar)
			const converted = ConvertJsonSchemaToGbnf(schema)
			if ('result' in converted) {
				result.grammar = converted.result
			}
		} catch {
			// Ignore grammar if parsing fails
		}
	}

	return result
}
