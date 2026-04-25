export {
	TPromptOptions,
	TPromptOptionsOpenAi,
	TPromptOptionsOllama,
	TPromptOptionsLlamaCpp,
	SPromptOptions,
	SPromptOptionsJson,
	defVal,
	defValJson,
} from './promptOptions/index.js'
export { CheckJsonSchema } from './checkJsonSchema.js'
export { PromptOptionsParse } from './promptOptionsParse.js'
export { PromptConvFromString } from './promptConvFromString.js'
export { PromptConvToString } from './promptConvToString.js'
export { ToPromptOptionsOpenAi, ToPromptOptionsOllama, ToPromptOptionsLlamaCpp } from './toPromptOptions.js'
export { ConvertJsonSchemaToGbnf } from './convertJsonSchemaToGbnf.js'

export type TPromptTool = {
	name: string
	spec?: string
	lang?: string
	code?: string
}

export type TPrompt = {
	system?: string
	user: string
	options?: TPromptOptions
	segment?: Record<string, string>
	jsonresponse?: string
	llm?: { url?: string; model?: string, gpulayer?: number }
	tool?: TPromptTool[]
}

import { TPromptOptions } from './promptOptions/index.js'
