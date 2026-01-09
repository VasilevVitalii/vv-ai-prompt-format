import { PromtLoad, PromtStore, TPromt } from '../src/index.js'

describe('PromtLoad', () => {
    test('парсит простой промпт с только user', () => {
        const raw = `$$begin
$$user
Hello World
$$end`

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].system).toBe('System prompt')
        expect(result[0].options).toEqual({ topK: 10 })
    })

    test('возвращает пустой массив если нет промптов', () => {
        const raw = `Just some text without prompts`
        const result = PromtLoad(raw)
        expect(result).toHaveLength(0)
    })

    test('пропускает промпт без $$user секции', () => {
        const raw = `$$begin
$$system
Only system, no user
$$end`

        const result = PromtLoad(raw)
        expect(result).toHaveLength(0)
    })

    test('обрабатывает пустые строки в промпте', () => {
        const raw = `$$begin
$$user
Line 1

Line 3
$$end`

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            penalizeNewline: true,
            trimWhitespace: false
        })
    })

    test('парсит boolean значения 0/1', () => {
        const raw = `$$begin
$$options
penalizeNewline=1
trimWhitespace=0
$$user
Test
$$end`

        const result = PromtLoad(raw)

        expect(result).toHaveLength(1)
        expect(result[0].options).toEqual({
            penalizeNewline: true,
            trimWhitespace: false
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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

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

        const result = PromtLoad(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].system).toBe('System prompt')
        expect(result[0].segment).toEqual({
            first: 'First segment',
            second: 'Second segment'
        })
    })
})

describe('PromtStore', () => {
    test('сериализует простой промпт', () => {
        const promts: TPromt[] = [{
            user: 'Hello World'
        }]

        const result = PromtStore(promts)

        expect(result).toBe(`$$begin
$$user
Hello World
$$end`)
    })

    test('сериализует промпт с system', () => {
        const promts: TPromt[] = [{
            system: 'You are helpful',
            user: 'Hello'
        }]

        const result = PromtStore(promts)

        expect(result).toBe(`$$begin
$$system
You are helpful
$$user
Hello
$$end`)
    })

    test('сериализует промпт с параметрами', () => {
        const promts: TPromt[] = [{
            user: 'Test',
            options: {
                temperature: 0.7,
                maxTokens: 2048
            }
        }]

        const result = PromtStore(promts)

        expect(result).toContain('$$options')
        expect(result).toContain('temperature=0.7')
        expect(result).toContain('maxTokens=2048')
        expect(result).toContain('$$user')
        expect(result).toContain('Test')
    })

    test('сериализует несколько промптов', () => {
        const promts: TPromt[] = [
            { user: 'First' },
            { user: 'Second' }
        ]

        const result = PromtStore(promts)

        expect(result).toContain('First')
        expect(result).toContain('Second')
        expect((result.match(/\$\$begin/g) || []).length).toBe(2)
        expect((result.match(/\$\$end/g) || []).length).toBe(2)
    })

    test('сериализует полный промпт', () => {
        const promts: TPromt[] = [{
            system: 'System prompt',
            user: 'User prompt',
            options: {
                temperature: 0.8,
                topP: 0.95
            }
        }]

        const result = PromtStore(promts)

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
        const promts: TPromt[] = [{
            user: 'User prompt',
            segment: {
                aaa: 'Content for aaa',
                bbb: 'Content for bbb'
            }
        }]

        const result = PromtStore(promts)

        expect(result).toContain('$$user')
        expect(result).toContain('User prompt')
        expect(result).toContain('$$segment=aaa')
        expect(result).toContain('Content for aaa')
        expect(result).toContain('$$segment=bbb')
        expect(result).toContain('Content for bbb')
    })

    test('сериализует полный промпт со всеми опциями и сегментами', () => {
        const promts: TPromt[] = [{
            system: 'System',
            user: 'User',
            options: {
                temperature: 0.7,
                trimWhitespace: true
            },
            segment: { seg1: 'Segment 1' }
        }]

        const result = PromtStore(promts)

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

describe('PromtLoad + PromtStore round-trip', () => {
    test('сохраняет данные при обратном преобразовании', () => {
        const original: TPromt[] = [
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

        const serialized = PromtStore(original)
        const parsed = PromtLoad(serialized)

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
        const original: TPromt[] = [
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

        const serialized = PromtStore(original)
        const parsed = PromtLoad(serialized)

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
        const original: TPromt[] = [
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

        const serialized = PromtStore(original)
        const parsed = PromtLoad(serialized)

        expect(parsed).toHaveLength(1)
        expect(parsed[0].options).toEqual(original[0].options)
    })
})
