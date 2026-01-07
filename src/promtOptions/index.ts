import { Static, Type } from '@sinclair/typebox'
import { PromtValue, defVal, defValJson } from './value.js'

export { defVal, defValJson }

export const SPromtOptions = Type.Object({
	temperature: Type.Optional(Type.Number({ ...PromtValue.temperature, default: defVal.temperature })),
	topP: Type.Optional(Type.Number({ ...PromtValue.topP, default: defVal.topP })),
	topK: Type.Optional(Type.Integer({ ...PromtValue.topK, default: defVal.topK })),
	minP: Type.Optional(Type.Number({ ...PromtValue.minP, default: defVal.minP })),
	maxTokens: Type.Optional(Type.Integer({ ...PromtValue.maxTokens, default: defVal.maxTokens })),
	repeatPenalty: Type.Optional(Type.Number({ ...PromtValue.repeatPenalty, default: defVal.repeatPenalty })),
	repeatPenaltyNum: Type.Optional(Type.Integer({ ...PromtValue.repeatPenaltyNum, default: defVal.repeatPenaltyNum })),
	presencePenalty: Type.Optional(Type.Number({ ...PromtValue.presencePenalty, default: defVal.presencePenalty })),
	frequencyPenalty: Type.Optional(Type.Number({ ...PromtValue.frequencyPenalty, default: defVal.frequencyPenalty })),
	mirostat: Type.Optional(Type.Integer({ ...PromtValue.mirostat, default: defVal.mirostat })),
	mirostatTau: Type.Optional(Type.Number({ ...PromtValue.mirostatTau, default: defVal.mirostatTau })),
	mirostatEta: Type.Optional(Type.Number({ ...PromtValue.mirostatEta, default: defVal.mirostatEta })),
	penalizeNewline: Type.Optional(Type.Boolean({ ...PromtValue.penalizeNewline, default: defVal.penalizeNewline })),
	stopSequences: Type.Optional(
		Type.Array(Type.String(), {
			...PromtValue.stopSequences,
			default: defVal.stopSequences,
		}),
	),
	trimWhitespace: Type.Optional(Type.Boolean({ ...PromtValue.trimWhitespace, default: defVal.trimWhitespace })),
	seed: Type.Optional(Type.Integer({ ...PromtValue.seed })),
})

export const SPromtOptionsJson = Type.Object({
	temperature: Type.Optional(Type.Number({ ...PromtValue.temperature, default: defValJson.temperature })),
	topP: Type.Optional(Type.Number({ ...PromtValue.topP, default: defValJson.topP })),
	topK: Type.Optional(Type.Integer({ ...PromtValue.topK, default: defValJson.topK })),
	minP: Type.Optional(Type.Number({ ...PromtValue.minP, default: defValJson.minP })),
	maxTokens: Type.Optional(Type.Integer({ ...PromtValue.maxTokens, default: defValJson.maxTokens })),
	repeatPenalty: Type.Optional(Type.Number({ ...PromtValue.repeatPenalty, default: defValJson.repeatPenalty })),
	repeatPenaltyNum: Type.Optional(Type.Integer({ ...PromtValue.repeatPenaltyNum, default: defValJson.repeatPenaltyNum })),
	presencePenalty: Type.Optional(Type.Number({ ...PromtValue.presencePenalty, default: defValJson.presencePenalty })),
	frequencyPenalty: Type.Optional(Type.Number({ ...PromtValue.frequencyPenalty, default: defValJson.frequencyPenalty })),
	mirostat: Type.Optional(Type.Integer({ ...PromtValue.mirostat, default: defValJson.mirostat })),
	mirostatTau: Type.Optional(Type.Number({ ...PromtValue.mirostatTau, default: defValJson.mirostatTau })),
	mirostatEta: Type.Optional(Type.Number({ ...PromtValue.mirostatEta, default: defValJson.mirostatEta })),
	penalizeNewline: Type.Optional(Type.Boolean({ ...PromtValue.penalizeNewline, default: defValJson.penalizeNewline })),
	stopSequences: Type.Optional(
		Type.Array(Type.String(), {
			...PromtValue.stopSequences,
			default: defValJson.stopSequences,
		}),
	),
	trimWhitespace: Type.Optional(Type.Boolean({ ...PromtValue.trimWhitespace, default: defValJson.trimWhitespace })),
	seed: Type.Optional(Type.Integer({ ...PromtValue.seed })),
})

export type TPromtOptions = Static<typeof SPromtOptions>
