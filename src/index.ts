export type TPromt = {
    system?: string,
    user: string,
    param?: Record<string, string>
}

export function PromtLoad(raw: string): TPromt[] {
    return parse(raw)
}

export function PromtStore(promt: TPromt[]): string {
    return serialize(promt)
}

function parse(content: string): TPromt[] {
    const lines = content.split('\n')
    const promts: TPromt[] = []

    let inBlock = false
    let currentPromt: Partial<TPromt> | null = null
    let currentSection: 'system' | 'user' | null = null
    let sectionContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        if (trimmed === '$$begin') {
            if (inBlock && currentPromt) {
                if (currentSection && sectionContent.length > 0) {
                    finishSection(currentPromt, currentSection, sectionContent)
                }
                if (currentPromt.user) {
                    promts.push(currentPromt as TPromt)
                }
            }
            inBlock = true
            currentPromt = {}
            currentSection = null
            sectionContent = []
            continue
        }

        if (trimmed === '$$end') {
            if (inBlock && currentPromt) {
                if (currentSection && sectionContent.length > 0) {
                    finishSection(currentPromt, currentSection, sectionContent)
                }
                if (currentPromt.user) {
                    promts.push(currentPromt as TPromt)
                }
            }
            inBlock = false
            currentPromt = null
            currentSection = null
            sectionContent = []
            continue
        }

        if (!inBlock || !currentPromt) {
            continue
        }

        if (trimmed === '$$system') {
            if (currentSection && sectionContent.length > 0) {
                finishSection(currentPromt, currentSection, sectionContent)
            }
            currentSection = 'system'
            sectionContent = []
            continue
        }

        if (trimmed === '$$user') {
            if (currentSection && sectionContent.length > 0) {
                finishSection(currentPromt, currentSection, sectionContent)
            }
            currentSection = 'user'
            sectionContent = []
            continue
        }

        if (trimmed.startsWith('$$@')) {
            if (currentSection && sectionContent.length > 0) {
                finishSection(currentPromt, currentSection, sectionContent)
                currentSection = null
                sectionContent = []
            }

            const paramLine = trimmed.substring(3)
            const eqIndex = paramLine.indexOf('=')
            if (eqIndex > 0) {
                const key = paramLine.substring(0, eqIndex).trim()
                const value = paramLine.substring(eqIndex + 1).trim()
                if (key) {
                    if (!currentPromt.param) {
                        currentPromt.param = {}
                    }
                    currentPromt.param[key] = value
                }
            }
            continue
        }

        if (currentSection) {
            sectionContent.push(line)
        }
    }

    if (inBlock && currentPromt) {
        if (currentSection && sectionContent.length > 0) {
            finishSection(currentPromt, currentSection, sectionContent)
        }
        if (currentPromt.user) {
            promts.push(currentPromt as TPromt)
        }
    }

    return promts
}

function finishSection(promt: Partial<TPromt>, section: 'system' | 'user', lines: string[]): void {
    const content = lines.join('\n').trim()
    if (section === 'system') {
        promt.system = content
    } else if (section === 'user') {
        promt.user = content
    }
}

function serialize(promts: TPromt[]): string {
    const result: string[] = []

    for (const promt of promts) {
        result.push('$$begin')

        if (promt.param) {
            for (const [key, value] of Object.entries(promt.param)) {
                result.push(`$$@${key}=${value}`)
            }
        }

        if (promt.system) {
            result.push('$$system')
            result.push(promt.system)
        }

        result.push('$$user')
        result.push(promt.user)

        result.push('$$end')
    }

    return result.join('\n')
}
