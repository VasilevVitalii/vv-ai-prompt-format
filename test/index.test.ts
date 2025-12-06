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
        expect(result[0].param).toBeUndefined()
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
$$@model=gpt-4
$$@temperature=0.7
$$user
Test prompt
$$end`

        const result = PromtLoad(raw)

        expect(result).toHaveLength(1)
        expect(result[0].param).toEqual({
            model: 'gpt-4',
            temperature: '0.7'
        })
        expect(result[0].user).toBe('Test prompt')
    })

    test('парсит промпт со всеми опциями', () => {
        const raw = `$$begin
$$@key1=value1
$$@key2=value2
$$system
System prompt here
$$user
User prompt here
$$end`

        const result = PromtLoad(raw)

        expect(result).toHaveLength(1)
        expect(result[0].system).toBe('System prompt here')
        expect(result[0].user).toBe('User prompt here')
        expect(result[0].param).toEqual({
            key1: 'value1',
            key2: 'value2'
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
$$@key=value
$$system
System prompt
$$end`

        const result = PromtLoad(raw)

        expect(result).toHaveLength(1)
        expect(result[0].user).toBe('User prompt')
        expect(result[0].system).toBe('System prompt')
        expect(result[0].param).toEqual({ key: 'value' })
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
            param: {
                key1: 'value1',
                key2: 'value2'
            }
        }]

        const result = PromtStore(promts)

        expect(result).toContain('$$@key1=value1')
        expect(result).toContain('$$@key2=value2')
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
            param: {
                model: 'gpt-4'
            }
        }]

        const result = PromtStore(promts)

        expect(result).toContain('$$begin')
        expect(result).toContain('$$@model=gpt-4')
        expect(result).toContain('$$system')
        expect(result).toContain('System prompt')
        expect(result).toContain('$$user')
        expect(result).toContain('User prompt')
        expect(result).toContain('$$end')
    })
})

describe('PromtLoad + PromtStore round-trip', () => {
    test('сохраняет данные при обратном преобразовании', () => {
        const original: TPromt[] = [
            {
                system: 'System 1',
                user: 'User 1',
                param: {
                    key1: 'value1',
                    key2: 'value2'
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
        expect(parsed[0].param).toEqual({ key1: 'value1', key2: 'value2' })
        expect(parsed[1].user).toBe('User 2')
        expect(parsed[1].system).toBeUndefined()
        expect(parsed[2].system).toBe('System 3')
        expect(parsed[2].user).toBe('User 3')
    })
})
