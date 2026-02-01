import { TPrompt } from './index.js'
import { PromptOptionsParse } from './promptOptionsParse.js'

/**
 * Loads and parses prompts from a text string with structured sections.
 *
 * @param raw - Raw text string containing prompts in the format with $$begin/$$end markers
 * @param use - Schema type for options validation: 'core' for standard AI models, 'json' for structured JSON output (default: 'core')
 * @returns Array of parsed TPrompt objects
 *
 * @remarks
 * Text format supports the following sections:
 * - `$$begin` / `$$end` - Marks prompt boundaries
 * - `$$system` - System message (optional)
 * - `$$user` - User message (required)
 * - `$$options` - Model parameters in key=value format (optional)
 * - `$$llm` - LLM configuration with url and model (optional)
 * - `$$jsonresponse` - JSON Schema for structured response output (optional)
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
 * $$jsonresponse
 * {"type": "object", "properties": {}}
 * $$end`
 *
 * const prompts = PromptConvFromString(text)
 * // Returns: [{ system: '...', user: '...', options: {...}, jsonresponse: '...' }]
 * ```
 */
export function PromptConvFromString(raw: string, use: 'core' | 'json' = 'core'): TPrompt[] {
	return parse(raw, use)
}

function parse(content: string, use: 'core' | 'json'): TPrompt[] {
	const lines = content.split('\n')
	const prompts: TPrompt[] = []

	let inBlock = false
	let currentPrompt: Partial<TPrompt> | null = null
	let currentSection: 'system' | 'user' | 'segment' | 'options' | 'llm' | 'jsonresponse' | null = null
	let currentSegmentName: string | null = null
	let sectionContent: string[] = []

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const trimmed = line.trim()

		if (trimmed === '$$begin') {
			if (inBlock && currentPrompt) {
				if (currentSection && sectionContent.length > 0) {
					finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
				}
				if (currentPrompt.user) {
					prompts.push(currentPrompt as TPrompt)
				}
			}
			inBlock = true
			currentPrompt = {}
			currentSection = null
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$end') {
			if (inBlock && currentPrompt) {
				if (currentSection && sectionContent.length > 0) {
					finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
				}
				if (currentPrompt.user) {
					prompts.push(currentPrompt as TPrompt)
				}
			}
			inBlock = false
			currentPrompt = null
			currentSection = null
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (!inBlock || !currentPrompt) {
			continue
		}

		if (trimmed === '$$system') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'system'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$user') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'user'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$options') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'options'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$llm') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'llm'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed === '$$jsonresponse') {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
			}
			currentSection = 'jsonresponse'
			currentSegmentName = null
			sectionContent = []
			continue
		}

		if (trimmed.startsWith('$$segment=')) {
			if (currentSection && sectionContent.length > 0) {
				finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
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

	if (inBlock && currentPrompt) {
		if (currentSection && sectionContent.length > 0) {
			finishSection(currentPrompt, currentSection, sectionContent, use, currentSegmentName)
		}
		if (currentPrompt.user) {
			prompts.push(currentPrompt as TPrompt)
		}
	}

	return prompts
}

function finishSection(prompt: Partial<TPrompt>, section: 'system' | 'user' | 'segment' | 'options' | 'llm' | 'jsonresponse', lines: string[], use: 'core' | 'json', segmentName?: string | null): void {
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
		if (llmConfig.url || llmConfig.model) {
			prompt.llm = {}
			if (llmConfig.url) {
				prompt.llm.url = String(llmConfig.url)
			}
			if (llmConfig.model) {
				prompt.llm.model = String(llmConfig.model)
			}
		}
	} else if (section === 'jsonresponse') {
		prompt.jsonresponse = content
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
