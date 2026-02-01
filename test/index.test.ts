import { PromptConvFromString, PromptConvToString, TPrompt } from '../src/index.js'

describe('PromptConvFromString', () => {
    test('парсит простой промпт с только user', () => {
        const raw = `$$begin
$$user
Hello World
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('Hello World')
        expect(result[0].system).toBeUndefined()
        expect(result[0].options).toBeUndefined()
    })

    test('парсит промпт с system и user', () => {
        const raw = `$$begin
$$system
You are a helpful assistant
$$user
What is 2+2?
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].system).toBe('You are a helpful assistant')
        expect(result[0].user).toBe('What is 2+2?')
    })

    test('парсит промпт с параметрами', () => {
        const raw = `$$begin
$$options
temperature=0.7
maxTokens=4096
$$user
Test prompt
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            temperature: 0.7,
            maxTokens: 4096
        })
        expect(result[0].user).toBe('Test prompt')
    })

    test('парсит промпт со всеми опциями', () => {
        const raw = `$$begin
$$options
temperature=0.5
topP=0.9
$$system
System prompt here
$$user
User prompt here
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].system).toBe('System prompt here')
        expect(result[0].user).toBe('User prompt here')
        expect(result[0].options).toEqual({
            temperature: 0.5,
            topP: 0.9
        })
    })

    test('парсит несколько промптов', () => {
        const raw = `$$begin
$$user
First prompt
$$end
$$begin
$$user
Second prompt
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(2)
        expect(result[0].user).toBe('First prompt')
        expect(result[1].user).toBe('Second prompt')
    })

    test('игнорирует текст до первого $$begin', () => {
        const raw = `This is some random text
That should be ignored
$$begin
$$user
Actual prompt
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('Actual prompt')
    })

    test('игнорирует текст после последнего $$end', () => {
        const raw = `$$begin
$$user
Actual prompt
$$end
This is some random text
That should be ignored`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('Actual prompt')
    })

    test('игнорирует текст между промптами', () => {
        const raw = `$$begin
$$user
First
$$end
Random text here
$$begin
$$user
Second
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(2)
        expect(result[0].user).toBe('First')
        expect(result[1].user).toBe('Second')
    })

    test('поддерживает многострочный промпт', () => {
        const raw = `$$begin
$$user
Line 1
Line 2
Line 3
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('Line 1\nLine 2\nLine 3')
    })

    test('поддерживает многострочный system', () => {
        const raw = `$$begin
$$system
System line 1
System line 2
$$user
User prompt
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].system).toBe('System line 1\nSystem line 2')
        expect(result[0].user).toBe('User prompt')
    })

    test('порядок секций не важен', () => {
        const raw = `$$begin
$$user
User prompt
$$options
topK=10
$$system
System prompt
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].system).toBe('System prompt')
        expect(result[0].options).toEqual({ topK: 10 })
    })

    test('возвращает пустой массив если нет промптов', () => {
        const raw = `Just some text without prompts`
        const result = PromptConvFromString(raw)
        expect(result).toHaveLength(0)
    })

    test('пропускает промпт без $$user секции', () => {
        const raw = `$$begin
$$system
Only system, no user
$$end`

        const result = PromptConvFromString(raw)
        expect(result).toHaveLength(0)
    })

    test('обрабатывает пустые строки в промпте', () => {
        const raw = `$$begin
$$user
Line 1

Line 3
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('Line 1\n\nLine 3')
    })

    test('парсит числовые значения в options', () => {
        const raw = `$$begin
$$options
temperature=0.7
topP=0.9
maxTokens=4096
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            temperature: 0.7,
            topP: 0.9,
            maxTokens: 4096
        })
    })

    test('парсит числа с запятой как разделителем', () => {
        const raw = `$$begin
$$options
temperature=0,7
topP=0,95
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            temperature: 0.7,
            topP: 0.95
        })
    })

    test('парсит числа в кавычках', () => {
        const raw = `$$begin
$$options
temperature="0.8"
topP='0.9'
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            temperature: 0.8,
            topP: 0.9
        })
    })

    test('парсит boolean значения', () => {
        const raw = `$$begin
$$options
penalizeNewline=true
trimWhitespace=false
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            penalizeNewline: true,
            trimWhitespace: false
        })
    })

    test('парсит числовые 0 и 1 как числа (не boolean)', () => {
        const raw = `$$begin
$$options
temperature=0
mirostat=1
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            temperature: 0,
            mirostat: 1
        })
    })

    test('парсит boolean значения y/n', () => {
        const raw = `$$begin
$$options
penalizeNewline=y
trimWhitespace=N
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            penalizeNewline: true,
            trimWhitespace: false
        })
    })

    test('парсит массив stopSequences', () => {
        const raw = `$$begin
$$options
stopSequences=["stop1", "stop2"]
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            stopSequences: ['stop1', 'stop2']
        })
    })

    test('парсит undefined значения (пустые)', () => {
        const raw = `$$begin
$$options
temperature=0.7
minP=
maxTokens=1000
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            temperature: 0.7,
            maxTokens: 1000
        })
        expect(result[0].options?.minP).toBeUndefined()
    })

    test('игнорирует неизвестные ключи в options', () => {
        const raw = `$$begin
$$options
temperature=0.7
unknownKey=value
maxTokens=1000
$$user
Test
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            temperature: 0.7,
            maxTokens: 1000
        })
        expect((result[0].options as any).unknownKey).toBeUndefined()
    })

    test('парсит промпт с одним сегментом', () => {
        const raw = `$$begin
$$user
User prompt
$$segment=aaa
Segment aaa content
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].segment).toEqual({ aaa: 'Segment aaa content' })
    })

    test('парсит промпт с несколькими сегментами', () => {
        const raw = `$$begin
$$user
User prompt
$$segment=aaa
Content for aaa
$$segment=bbb
Content for bbb
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].segment).toEqual({
            aaa: 'Content for aaa',
            bbb: 'Content for bbb'
        })
    })

    test('парсит многострочный сегмент', () => {
        const raw = `$$begin
$$user
User prompt
$$segment=test
Line 1
Line 2
Line 3
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].segment).toEqual({ test: 'Line 1\nLine 2\nLine 3' })
    })

    test('порядок с сегментами не важен', () => {
        const raw = `$$begin
$$segment=first
First segment
$$user
User prompt
$$system
System prompt
$$segment=second
Second segment
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].system).toBe('System prompt')
        expect(result[0].segment).toEqual({
            first: 'First segment',
            second: 'Second segment'
        })
    })
})

describe('PromptConvToString', () => {
    test('сериализует простой промпт', () => {
        const prompts: TPrompt[] = [{
            user: 'Hello World'
        }]

        const result = PromptConvToString(prompts)

        expect(result).toBe(`$$begin
$$user
Hello World
$$end`)
    })

    test('сериализует промпт с system', () => {
        const prompts: TPrompt[] = [{
            system: 'You are helpful',
            user: 'Hello'
        }]

        const result = PromptConvToString(prompts)

        expect(result).toBe(`$$begin
$$system
You are helpful
$$user
Hello
$$end`)
    })

    test('сериализует промпт с параметрами', () => {
        const prompts: TPrompt[] = [{
            user: 'Test',
            options: {
                temperature: 0.7,
                maxTokens: 2048
            }
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$options')
        expect(result).toContain('temperature=0.7')
        expect(result).toContain('maxTokens=2048')
        expect(result).toContain('$$user')
        expect(result).toContain('Test')
    })

    test('сериализует несколько промптов', () => {
        const prompts: TPrompt[] = [
            { user: 'First' },
            { user: 'Second' }
        ]

        const result = PromptConvToString(prompts)

        expect(result).toContain('First')
        expect(result).toContain('Second')
        expect((result.match(/\$\$begin/g) || []).length).toBe(2)
        expect((result.match(/\$\$end/g) || []).length).toBe(2)
    })

    test('сериализует полный промпт', () => {
        const prompts: TPrompt[] = [{
            system: 'System prompt',
            user: 'User prompt',
            options: {
                temperature: 0.8,
                topP: 0.95
            }
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$begin')
        expect(result).toContain('$$options')
        expect(result).toContain('temperature=0.8')
        expect(result).toContain('topP=0.95')
        expect(result).toContain('$$system')
        expect(result).toContain('System prompt')
        expect(result).toContain('$$user')
        expect(result).toContain('User prompt')
        expect(result).toContain('$$end')
    })

    test('сериализует промпт с сегментами', () => {
        const prompts: TPrompt[] = [{
            user: 'User prompt',
            segment: {
                aaa: 'Content for aaa',
                bbb: 'Content for bbb'
            }
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$user')
        expect(result).toContain('User prompt')
        expect(result).toContain('$$segment=aaa')
        expect(result).toContain('Content for aaa')
        expect(result).toContain('$$segment=bbb')
        expect(result).toContain('Content for bbb')
    })

    test('сериализует полный промпт со всеми опциями и сегментами', () => {
        const prompts: TPrompt[] = [{
            system: 'System',
            user: 'User',
            options: {
                temperature: 0.7,
                trimWhitespace: true
            },
            segment: { seg1: 'Segment 1' }
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$begin')
        expect(result).toContain('$$options')
        expect(result).toContain('temperature=0.7')
        expect(result).toContain('trimWhitespace=true')
        expect(result).toContain('$$system')
        expect(result).toContain('System')
        expect(result).toContain('$$user')
        expect(result).toContain('User')
        expect(result).toContain('$$segment=seg1')
        expect(result).toContain('Segment 1')
        expect(result).toContain('$$end')
    })
})

describe('PromptConvFromString + PromptConvToString round-trip', () => {
    test('сохраняет данные при обратном преобразовании', () => {
        const original: TPrompt[] = [
            {
                system: 'System 1',
                user: 'User 1',
                options: {
                    temperature: 0.7,
                    maxTokens: 1000
                }
            },
            {
                user: 'User 2'
            },
            {
                system: 'System 3',
                user: 'User 3'
            }
        ]

        const serialized = PromptConvToString(original)
        const parsed = PromptConvFromString(serialized)

        expect(parsed).toHaveLength(3)
        expect(parsed[0].system).toBe('System 1')
        expect(parsed[0].user).toBe('User 1')
        expect(parsed[0].options).toEqual({ temperature: 0.7, maxTokens: 1000 })
        expect(parsed[1].user).toBe('User 2')
        expect(parsed[1].system).toBeUndefined()
        expect(parsed[2].system).toBe('System 3')
        expect(parsed[2].user).toBe('User 3')
    })

    test('сохраняет данные с сегментами при обратном преобразовании', () => {
        const original: TPrompt[] = [
            {
                system: 'System',
                user: 'User',
                options: {
                    topK: 40,
                    penalizeNewline: false
                },
                segment: {
                    seg1: 'Segment 1',
                    seg2: 'Segment 2'
                }
            }
        ]

        const serialized = PromptConvToString(original)
        const parsed = PromptConvFromString(serialized)

        expect(parsed).toHaveLength(1)
        expect(parsed[0].system).toBe('System')
        expect(parsed[0].user).toBe('User')
        expect(parsed[0].options).toEqual({ topK: 40, penalizeNewline: false })
        expect(parsed[0].segment).toEqual({
            seg1: 'Segment 1',
            seg2: 'Segment 2'
        })
    })

    test('сохраняет все параметры включая tokenBias и массивы при round-trip', () => {
        const original: TPrompt[] = [
            {
                system: 'Test system',
                user: 'Test user',
                options: {
                    temperature: 0.8,
                    topP: 0.95,
                    topK: 40,
                    minP: 0.05,
                    maxTokens: 2048,
                    frequencyPenalty: 0.5,
                    presencePenalty: 0.3,
                    repeatPenalty: 1.1,
                    repeatPenaltyNum: 64,
                    stopSequences: ['stop1', 'stop2', 'stop3'],
                    tokenBias: { '123': 0.5, '456': -0.3, '789': 1.0 },
                    trimWhitespace: true,
                    penalizeNewline: false,
                    seed: 42
                }
            }
        ]

        const serialized = PromptConvToString(original)
        const parsed = PromptConvFromString(serialized)

        expect(parsed).toHaveLength(1)
        expect(parsed[0].options).toEqual(original[0].options)
    })
})

describe('$$llm section', () => {
    test('парсит промпт с секцией $$llm', () => {
        const raw = `$$begin
$$llm
url=http://localhost:12345
model=Qwen2.5-Coder-7B-Instruct-Q5_K_M.0.gguf
$$user
Generate code
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('Generate code')
        expect(result[0].llm).toEqual({
            url: 'http://localhost:12345',
            model: 'Qwen2.5-Coder-7B-Instruct-Q5_K_M.0.gguf'
        })
    })

    test('парсит промпт со всеми секциями включая $$llm', () => {
        const raw = `$$begin
$$llm
url=http://localhost:8080
model=test-model
$$system
You are a helpful assistant
$$user
Generate user data
$$options
temperature=0.3
maxTokens=1000
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].llm).toEqual({
            url: 'http://localhost:8080',
            model: 'test-model'
        })
        expect(result[0].system).toBe('You are a helpful assistant')
        expect(result[0].user).toBe('Generate user data')
        expect(result[0].options).toEqual({ temperature: 0.3, maxTokens: 1000 })
    })

    test('сериализует промпт с llm в секцию $$llm', () => {
        const prompts: TPrompt[] = [{
            user: 'Test prompt',
            llm: {
                url: 'http://localhost:5000',
                model: 'my-model'
            }
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$llm')
        expect(result).toContain('url=http://localhost:5000')
        expect(result).toContain('model=my-model')
    })

    test('сериализует полный промпт с llm', () => {
        const prompts: TPrompt[] = [{
            llm: {
                url: 'http://api.example.com',
                model: 'gpt-4'
            },
            system: 'System prompt',
            user: 'User prompt',
            options: {
                temperature: 0.5,
                maxTokens: 2048
            }
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$begin')
        expect(result).toContain('$$llm')
        expect(result).toContain('url=http://api.example.com')
        expect(result).toContain('model=gpt-4')
        expect(result).toContain('$$options')
        expect(result).toContain('temperature=0.5')
        expect(result).toContain('$$system')
        expect(result).toContain('System prompt')
        expect(result).toContain('$$user')
        expect(result).toContain('User prompt')
        expect(result).toContain('$$end')
    })

    test('round-trip сохраняет llm через $$llm', () => {
        const original: TPrompt[] = [{
            llm: {
                url: 'http://localhost:11434',
                model: 'llama2'
            },
            system: 'Generate data',
            user: 'Create a user object',
            options: {
                temperature: 0.3,
                maxTokens: 1500
            }
        }]

        const serialized = PromptConvToString(original)
        const parsed = PromptConvFromString(serialized)

        expect(parsed).toHaveLength(1)
        expect(parsed[0].llm).toEqual(original[0].llm)
        expect(parsed[0].system).toBe(original[0].system)
        expect(parsed[0].user).toBe(original[0].user)
        expect(parsed[0].options).toEqual(original[0].options)
    })

    test('порядок секций с $$llm не важен', () => {
        const raw = `$$begin
$$user
User prompt
$$llm
url=http://test.com
model=test-model
$$system
System prompt
$$options
topK=40
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].llm).toEqual({
            url: 'http://test.com',
            model: 'test-model'
        })
        expect(result[0].system).toBe('System prompt')
        expect(result[0].options).toEqual({ topK: 40 })
    })

    test('парсит промпт только с url в $$llm', () => {
        const raw = `$$begin
$$llm
url=http://localhost:8080
$$user
Test prompt
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].llm).toEqual({
            url: 'http://localhost:8080'
        })
        expect(result[0].llm?.model).toBeUndefined()
    })

    test('парсит промпт только с model в $$llm', () => {
        const raw = `$$begin
$$llm
model=gpt-4
$$user
Test prompt
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].llm).toEqual({
            model: 'gpt-4'
        })
        expect(result[0].llm?.url).toBeUndefined()
    })

    test('сериализует промпт только с url в $$llm', () => {
        const prompts: TPrompt[] = [{
            user: 'Test',
            llm: {
                url: 'http://localhost:3000'
            }
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$llm')
        expect(result).toContain('url=http://localhost:3000')
        expect(result).not.toContain('model=')
    })

    test('сериализует промпт только с model в $$llm', () => {
        const prompts: TPrompt[] = [{
            user: 'Test',
            llm: {
                model: 'llama2'
            }
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$llm')
        expect(result).toContain('model=llama2')
        expect(result).not.toContain('url=')
    })

    test('round-trip сохраняет только url', () => {
        const original: TPrompt[] = [{
            user: 'Test',
            llm: {
                url: 'http://example.com'
            }
        }]

        const serialized = PromptConvToString(original)
        const parsed = PromptConvFromString(serialized)

        expect(parsed[0].llm).toEqual({ url: 'http://example.com' })
        expect(parsed[0].llm?.model).toBeUndefined()
    })

    test('round-trip сохраняет только model', () => {
        const original: TPrompt[] = [{
            user: 'Test',
            llm: {
                model: 'claude-3'
            }
        }]

        const serialized = PromptConvToString(original)
        const parsed = PromptConvFromString(serialized)

        expect(parsed[0].llm).toEqual({ model: 'claude-3' })
        expect(parsed[0].llm?.url).toBeUndefined()
    })
})

describe('$$jsonresponse section', () => {
    test('парсит промпт с секцией $$jsonresponse', () => {
        const raw = `$$begin
$$user
Generate a JSON response
$$jsonresponse
{"type": "object", "properties": {"name": {"type": "string"}}}
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('Generate a JSON response')
        expect(result[0].jsonresponse).toBe('{"type": "object", "properties": {"name": {"type": "string"}}}')
    })

    test('парсит многострочный JSON Schema в $$jsonresponse', () => {
        const raw = `$$begin
$$user
Generate structured data
$$jsonresponse
{
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "age": {"type": "number"}
  }
}
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].jsonresponse).toContain('"type": "object"')
        expect(result[0].jsonresponse).toContain('"name"')
        expect(result[0].jsonresponse).toContain('"age"')
    })

    test('парсит промпт со всеми секциями включая $$jsonresponse', () => {
        const raw = `$$begin
$$system
You are a helpful assistant
$$user
Generate user data
$$options
temperature=0.3
maxTokens=1000
$$jsonresponse
{"type": "object", "required": ["name"]}
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].system).toBe('You are a helpful assistant')
        expect(result[0].user).toBe('Generate user data')
        expect(result[0].options).toEqual({ temperature: 0.3, maxTokens: 1000 })
        expect(result[0].jsonresponse).toBe('{"type": "object", "required": ["name"]}')
    })

    test('сериализует промпт с jsonresponse в секцию $$jsonresponse', () => {
        const prompts: TPrompt[] = [{
            user: 'Generate JSON',
            jsonresponse: '{"type": "string"}'
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$jsonresponse')
        expect(result).toContain('{"type": "string"}')
    })

    test('сериализует полный промпт с jsonresponse', () => {
        const prompts: TPrompt[] = [{
            system: 'System prompt',
            user: 'User prompt',
            options: {
                temperature: 0.5,
                maxTokens: 2048
            },
            jsonresponse: '{"type": "object", "properties": {}}'
        }]

        const result = PromptConvToString(prompts)

        expect(result).toContain('$$begin')
        expect(result).toContain('$$options')
        expect(result).toContain('temperature=0.5')
        expect(result).toContain('$$system')
        expect(result).toContain('System prompt')
        expect(result).toContain('$$user')
        expect(result).toContain('User prompt')
        expect(result).toContain('$$jsonresponse')
        expect(result).toContain('{"type": "object", "properties": {}}')
        expect(result).toContain('$$end')
    })

    test('round-trip сохраняет jsonresponse через $$jsonresponse', () => {
        const original: TPrompt[] = [{
            system: 'Generate data',
            user: 'Create a user object',
            options: {
                temperature: 0.3,
                maxTokens: 1500
            },
            jsonresponse: '{"type": "object", "properties": {"id": {"type": "number"}, "name": {"type": "string"}}}'
        }]

        const serialized = PromptConvToString(original)
        const parsed = PromptConvFromString(serialized)

        expect(parsed).toHaveLength(1)
        expect(parsed[0].system).toBe(original[0].system)
        expect(parsed[0].user).toBe(original[0].user)
        expect(parsed[0].options).toEqual(original[0].options)
        expect(parsed[0].jsonresponse).toBe(original[0].jsonresponse)
    })

    test('порядок секций с $$jsonresponse не важен', () => {
        const raw = `$$begin
$$jsonresponse
{"type": "string"}
$$user
User prompt
$$system
System prompt
$$options
topK=40
$$end`

        const result = PromptConvFromString(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].system).toBe('System prompt')
        expect(result[0].options).toEqual({ topK: 40 })
        expect(result[0].jsonresponse).toBe('{"type": "string"}')
    })
})
