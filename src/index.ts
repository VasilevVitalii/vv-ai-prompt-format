export { TPromtOptions, TPromtOptionsOpenAi, TPromtOptionsOllama, TPromtOptionsLlamaCpp, SPromtOptions, SPromtOptionsJson } from './promtOptions/index.js'
export { CheckJsonSchema } from './checkJsonSchema.js'
export { PromtOptionsParse } from './promtOptionsParse.js'
export { PromtLoad } from './promtLoad.js'
export { PromtStore } from './promtStore.js'
export { ToPromtOptionsOpenAi, ToPromtOptionsOllama, ToPromtOptionsLlamaCpp } from './toPromtOptions.js'
export { ConvertJsonSchemaToGbnf } from './convertJsonSchemaToGbnf.js'

export type TPromt = {
	system?: string
	user: string
	options?: TPromtOptions
	segment?: Record<string, string>
	grammar?: string
}

import { TPromtOptions } from './promtOptions/index.js'
