import { IntegerOptions, NumberOptions, SchemaOptions, Static, Type } from '@sinclair/typebox'

export const PromtValue = {
	temperature: {
		description: 'Sampling temperature (higher = more creative, lower = more deterministic)',
		minimum: 0.0,
		maximum: 2.0,
	} as NumberOptions,
	topP: {
		description: 'Nucleus sampling: cumulative probability threshold',
		minimum: 0.0,
		maximum: 1.0,
	} as NumberOptions,
	topK: {
		description: 'Top-K sampling: number of highest probability tokens to keep',
		minimum: 1,
		maximum: 1000,
	} as IntegerOptions,
	minP: {
		description: 'Minimum probability threshold for token sampling',
		minimum: 0.0,
		maximum: 1.0,
	} as NumberOptions,
	maxTokens: {
		description: 'Maximum number of tokens to generate',
		minimum: 1,
		maximum: 131072,
	} as IntegerOptions,
	repeatPenalty: {
		description: 'Penalty for repeating tokens (1.0 = no penalty)',
		minimum: -2.0,
		maximum: 2.0,
	} as NumberOptions,
	repeatPenaltyNum: {
		description: 'Number of last tokens to apply repeat penalty to',
		minimum: 0,
		maximum: 2048,
	} as IntegerOptions,
	presencePenalty: {
		description: 'Penalty for tokens that have appeared (0.0 = no penalty)',
		minimum: -2.0,
		maximum: 2.0,
	} as NumberOptions,
	frequencyPenalty: {
		description: 'Penalty proportional to token frequency (0.0 = no penalty)',
		minimum: -2.0,
		maximum: 2.0,
	} as NumberOptions,
	mirostat: {
		description: 'Mirostat sampling mode (0 = disabled, 1 = Mirostat 1.0, 2 = Mirostat 2.0)',
		minimum: 0,
		maximum: 2,
	} as IntegerOptions,
	mirostatTau: {
		description: 'Mirostat target entropy (used when mirostat > 0)',
		minimum: 0.0,
		maximum: 10.0,
	} as NumberOptions,
	mirostatEta: {
		description: 'Mirostat learning rate (used when mirostat > 0)',
		minimum: 0,
		maximum: 1.0,
	} as NumberOptions,
	penalizeNewline: {
		description: 'Penalize newline tokens in generation',
	} as SchemaOptions,
	stopSequences: {
		description: 'Array of strings that will stop generation when encountered',
	} as SchemaOptions,
	trimWhitespace: {
		description: 'Trim leading and trailing whitespace from output',
	} as SchemaOptions,
	seed: {
		description: 'Random seed for reproducible results (optional)',
		minimum: 0,
	} as IntegerOptions,
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
}

