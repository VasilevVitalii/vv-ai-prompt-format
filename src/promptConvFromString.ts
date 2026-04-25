import { TPrompt } from './index.js'
import { PromptOptionsParse } from './promptOptionsParse.js'

export function PromptConvFromString(raw: string, use: 'core' | 'json' = 'core'): TPrompt[] {
	return parse(raw, use)
}

type NonToolcodeSectionType = 'system' | 'user' | 'segment' | 'options' | 'llm' | 'jsonresponse' | 'tool'
type SectionType = NonToolcodeSectionType | 'toolcode'

function parse(content: string, use: 'core' | 'json'): TPrompt[] {
	const lines = content.split('\n')
	const prompts: TPrompt[] = []

	let inBlock = false
	let currentPrompt: Partial<TPrompt> | null = null
	let currentSection: SectionType | null = null
	let currentSegmentName: string | null = null
	let currentToolcodeLang: string | null = null
	let currentToolcodeName: string | null = null
	let sectionContent: string[] = []
	let pendingToolCodes: { name: string; lang: string; code: string }[] = []

	function flushSection(): void {
		if (!currentSection || !currentPrompt) return
		if (currentSection === 'toolcode') {
			if (currentToolcodeLang && currentToolcodeName && sectionContent.length > 0) {
				pendingToolCodes.push({
					name: currentToolcodeName,
					lang: currentToolcodeLang,
					code: sectionContent.join('\n').trim()
				})
			}
		} else if (sectionContent.length > 0) {
			finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
		}
	}

	function finalizeBlock(): void {
		flushSection()
		if (currentPrompt && currentPrompt.user) {
			if (pendingToolCodes.length > 0 && currentPrompt.tool) {
				for (const tc of pendingToolCodes) {
					const tool = currentPrompt.tool.find(t => t.name === tc.name && t.spec !== undefined)
					if (tool) {
						tool.lang = tc.lang
						tool.code = tc.code
					}
				}
			}
			prompts.push(currentPrompt as TPrompt)
		}
		pendingToolCodes = []
	}

	function resetSection(section: SectionType): void {
		flushSection()
		currentSection = section
		currentSegmentName = null
		currentToolcodeLang = null
		currentToolcodeName = null
		sectionContent = []
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const trimmed = line.trim()

		if (trimmed === '$$begin') {
			if (inBlock && currentPrompt) {
				finalizeBlock()
			}
			inBlock = true
			currentPrompt = {}
			currentSection = null
			currentSegmentName = null
			currentToolcodeLang = null
			currentToolcodeName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$end') {
			if (inBlock && currentPrompt) {
				finalizeBlock()
			}
			inBlock = false
			currentPrompt = null
			currentSection = null
			currentSegmentName = null
			currentToolcodeLang = null
			currentToolcodeName = null
			sectionContent = []
			continue
		}

		if (!inBlock || !currentPrompt) continue

		if (trimmed === '$$system') { resetSection('system'); continue }
		if (trimmed === '$$user') { resetSection('user'); continue }
		if (trimmed === '$$options') { resetSection('options'); continue }
		if (trimmed === '$$llm') { resetSection('llm'); continue }
		if (trimmed === '$$jsonresponse') { resetSection('jsonresponse'); continue }
		if (trimmed === '$$tool') { resetSection('tool'); continue }

		if (trimmed.startsWith('$$segment=')) {
			resetSection('segment')
			currentSegmentName = trimmed.substring('$$segment='.length).trim()
			continue
		}

		const toolcodeMatch = trimmed.match(/^\$\$tool=([^=]+)=(.+)$/)
		if (toolcodeMatch) {
			resetSection('toolcode')
			currentToolcodeLang = toolcodeMatch[1]
			currentToolcodeName = toolcodeMatch[2]
			continue
		}

		if (currentSection) {
			sectionContent.push(line)
		}
	}

	if (inBlock && currentPrompt) {
		finalizeBlock()
	}

	return prompts
}

function finishSection(prompt: Partial<TPrompt>, section: NonToolcodeSectionType, lines: string[], use: 'core' | 'json', segmentName?: string | null): void {
	const content = lines.join('\n').trim()
	if (section === 'system') {
		prompt.system = content
	} else if (section === 'user') {
		prompt.user = content
	} else if (section === 'segment' && segmentName) {
		if (!prompt.segment) {
			prompt.segment = {}
		}
		prompt.segment[segmentName] = content
	} else if (section === 'options') {
		const rawOptions = parseOptionsToObject(content)
		prompt.options = PromptOptionsParse(use, rawOptions, false)
	} else if (section === 'llm') {
		const llmConfig = parseOptionsToObject(content)
		if (llmConfig.url || llmConfig.model || llmConfig.gpulayer !== undefined) {
			prompt.llm = {}
			if (llmConfig.url) {
				prompt.llm.url = String(llmConfig.url)
			}
			if (llmConfig.model) {
				prompt.llm.model = String(llmConfig.model)
			}
			if (llmConfig.gpulayer !== undefined) {
				prompt.llm.gpulayer = Number(llmConfig.gpulayer)
			}
		}
	} else if (section === 'jsonresponse') {
		prompt.jsonresponse = content
	} else if (section === 'tool') {
		try {
			const parsed = JSON.parse(content)
			if (Array.isArray(parsed)) {
				prompt.tool = parsed
			}
		} catch {
			// ignore invalid JSON
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

function parseOptionValue(valueStr: string): number | boolean | string | string[] | Record<string, any> | undefined {
	// Пустое значение = undefined
	if (valueStr === '') {
		return undefined
	}

	// Убираем кавычки если есть
	let cleanValue = valueStr
	if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
		cleanValue = cleanValue.slice(1, -1)
	}

	// Пробуем распарсить как JSON (для массивов и объектов)
	if (valueStr.startsWith('[') || valueStr.startsWith('{')) {
		try {
			const parsed = JSON.parse(valueStr)
			if (Array.isArray(parsed) || typeof parsed === 'object') {
				return parsed
			}
		} catch {
			// Игнорируем ошибку, попробуем другие варианты
		}
	}

	// Числовые значения - проверяем ПЕРЕД boolean, чтобы "0" и "1" парсились как числа
	const numValue = cleanValue.replace(',', '.')
	const parsed = parseFloat(numValue)
	if (!isNaN(parsed)) {
		return parsed
	}

	// Boolean значения (только true/false/y/n, без 0/1 чтобы не конфликтовать с числами)
	const lower = cleanValue.toLowerCase()
	if (lower === 'true' || lower === 'y') return true
	if (lower === 'false' || lower === 'n') return false

	// Если ничего не подошло, возвращаем как строку
	return cleanValue
}
