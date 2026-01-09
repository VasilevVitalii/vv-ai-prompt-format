import { TPromt, TPromtOptions } from './index.js'
import { PromtOptionsParse } from './promtOptionsParse.js'

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
		promt.grammar = content
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

function parseOptionValue(valueStr: string): number | boolean | string[] | Record<string, any> | undefined {
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
