import { IntegerOptions, NumberOptions, SchemaOptions } from '@sinclair/typebox'

export const PromtValue = {
	temperature: {
		description: '[openai, ollama, llama-cpp] Sampling temperature (higher = more creative, lower = more deterministic)',
		minimum: 0.0,
		maximum: 2.0,
	} as NumberOptions,
	topP: {
		description: '[openai, ollama, llama-cpp] Nucleus sampling: cumulative probability threshold',
		minimum: 0.0,
		maximum: 1.0,
	} as NumberOptions,
	topK: {
		description: '[ollama, llama-cpp] Top-K sampling: number of highest probability tokens to keep',
		minimum: 1,
		maximum: 1000,
	} as IntegerOptions,
	minP: {
		description: '[llama-cpp] Minimum probability threshold for token sampling',
		minimum: 0.0,
		maximum: 1.0,
	} as NumberOptions,
	maxTokens: {
		description: '[openai, ollama, llama-cpp] Maximum number of tokens to generate',
		minimum: 1,
		maximum: 131072,
	} as IntegerOptions,
	repeatPenalty: {
		description: '[ollama, llama-cpp] Penalty for repeating tokens (1.0 = no penalty)',
		minimum: -2.0,
		maximum: 2.0,
	} as NumberOptions,
	repeatPenaltyNum: {
		description: '[ollama, llama-cpp] Number of last tokens to apply repeat penalty to',
		minimum: 0,
		maximum: 2048,
	} as IntegerOptions,
	presencePenalty: {
		description: '[openai, llama-cpp] Penalty for tokens that have appeared (0.0 = no penalty)',
		minimum: -2.0,
		maximum: 2.0,
	} as NumberOptions,
	frequencyPenalty: {
		description: '[openai, llama-cpp] Penalty proportional to token frequency (0.0 = no penalty)',
		minimum: -2.0,
		maximum: 2.0,
	} as NumberOptions,
	mirostat: {
		description: '[ollama, llama-cpp] Mirostat sampling mode (0 = disabled, 1 = Mirostat 1.0, 2 = Mirostat 2.0)',
		minimum: 0,
		maximum: 2,
	} as IntegerOptions,
	mirostatTau: {
		description: '[ollama, llama-cpp] Mirostat target entropy (used when mirostat > 0)',
		minimum: 0.0,
		maximum: 10.0,
	} as NumberOptions,
	mirostatEta: {
		description: '[ollama, llama-cpp] Mirostat learning rate (used when mirostat > 0)',
		minimum: 0,
		maximum: 1.0,
	} as NumberOptions,
	penalizeNewline: {
		description: '[ollama, llama-cpp] Penalize newline tokens in generation',
	} as SchemaOptions,
	stopSequences: {
		description: '[openai, ollama, llama-cpp] Array of strings that will stop generation when encountered',
	} as SchemaOptions,
	trimWhitespace: {
		description: '[llama-cpp] Trim leading and trailing whitespace from output',
	} as SchemaOptions,
	seed: {
		description: '[openai, ollama, llama-cpp] Random seed for reproducible results (optional)',
		minimum: 0,
	} as IntegerOptions,
	tokenBias: {
		description: '[openai, llama-cpp] Token bias to adjust probability of specific tokens',
	} as SchemaOptions,
	evaluationPriority: {
		description: '[llama-cpp] Priority for sequence evaluation',
		minimum: 0,
		maximum: 10,
	} as IntegerOptions,
	contextShiftSize: {
		description: '[llama-cpp] Number of tokens to remove when context overflows (0 = auto)',
		minimum: 0,
		maximum: 4096,
	} as IntegerOptions,
	disableContextShift: {
		description: '[llama-cpp] Disable context shift when context is full',
	} as SchemaOptions,
}

export const defVal = {
    temperature: 0.8,
    topP: 0.9,
    topK: 40,
    minP: 0.0,
    maxTokens: 128,
    repeatPenalty: 1.1,
    repeatPenaltyNum: 64,
    presencePenalty: 0.0,
    frequencyPenalty: 1.1,
    mirostat: 0,
    mirostatTau: 5.0,
    mirostatEta: 0.1,
    penalizeNewline: true,
    stopSequences: [],
    trimWhitespace: true,
    tokenBias: {},
    evaluationPriority: 5,
    contextShiftSize: 0,
    disableContextShift: false,
}

export const defValJson = {
    temperature: 0.0,
    topP: 0.1,
    topK: 10,
    minP: 0.0,
    maxTokens: 4096,
    repeatPenalty: 1.0,
    repeatPenaltyNum: 0,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    mirostat: 0,
    mirostatTau: 5.0,
    mirostatEta: 0.1,
    penalizeNewline: false,
    stopSequences: [],
    trimWhitespace: true,
    tokenBias: {},
    evaluationPriority: 5,
    contextShiftSize: 0,
    disableContextShift: false,
}

