<div id="badges">
  <a href="https://www.linkedin.com/in/vasilev-vitalii/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
  <a href="https://www.youtube.com/@user-gj9vk5ln5c/featured">
    <img src="https://img.shields.io/badge/YouTube-red?style=for-the-badge&logo=youtube&logoColor=white" alt="Youtube Badge"/>
  </a>
</div>

[English](readme.md)

# vv-ai-prompt-format

Легковесная TypeScript библиотека для хранения и управления AI-промптами в простом текстовом формате.

## Возможности

- Простой текстовый формат для хранения промптов
- Поддержка системных и пользовательских промптов
- Пользовательские параметры для каждого промпта
- Несколько промптов в одном файле
- Парсинг и сериализация промптов в/из текста
- Поддержка tool calling: серверный, клиентский и inline режимы выполнения

## Установка

```bash
npm install vv-ai-prompt-format
```

## Формат

Библиотека использует простой текстовый формат со специальными маркерами:

```
$$begin
$$llm
url=http://localhost:11434
model=llama2
gpulayer=33
$$options
temperature=0.7
maxTokens=4096
$$system
Текст системного промпта
$$user
Текст пользовательского промпта
$$jsonresponse
{"type": "object", "properties": {"name": {"type": "string"}}}
$$segment=имяСегмента
Содержимое сегмента
$$tool
calculator
search
$$tool=spec=search
Ищет в интернете. Аргументы: query (string)
$$tool=JS=search
return await fetch(`https://api.search.com?q=${args.query}`).then(r => r.json())
$$end
```

### Правила формата:

- `$$begin` - Начало блока промпта
- `$$end` - Конец блока промпта
- `$$user` - Пользовательский промпт (обязательно)
- `$$system` - Системный промпт (опционально)
- `$$llm` - Конфигурация LLM с url, model и gpulayer (опционально)
- `$$options` - Секция настроек LLM (опционально)
- `$$jsonresponse` - JSON Schema для структурированного вывода ответа (опционально)
- `$$segment=имя` - Именованные текстовые сегменты (опционально)
- `$$tool` - Список имён инструментов, по одному на строку (опционально)
- `$$tool=spec=<имя>` - Спецификация инструмента для модели (опционально, требует соответствующей записи в `$$tool`)
- `$$tool=<lang>=<имя>` - Inline-код инструмента (опционально, требует соответствующей `$$tool=spec=<имя>`)
- Текст до первого `$$begin` и после последнего `$$end` игнорируется
- Порядок секций внутри блока не важен
- Все секции, кроме `$$user`, опциональны
- Можно определить несколько сегментов с разными именами

## Использование

### Парсинг промптов из текста

```typescript
import { PromptConvFromString } from 'vv-ai-prompt-format'

const text = `
$$begin
$$options
temperature=0.7
maxTokens=4096
$$system
Ты полезный ассистент
$$user
Сколько будет 2+2?
$$end
`

const prompts = PromptConvFromString(text)
console.log(prompts)
// [{
//   system: 'Ты полезный ассистент',
//   user: 'Сколько будет 2+2?',
//   options: { temperature: 0.7, maxTokens: 4096 }
// }]
```

### Сериализация промптов в текст

```typescript
import { PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  system: 'Ты полезный ассистент',
  user: 'Привет, мир!',
  options: {
    temperature: 0.7,
    maxTokens: 4096
  }
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$options
// temperature=0.7
// maxTokens=4096
// $$system
// Ты полезный ассистент
// $$user
// Привет, мир!
// $$end
```

### Несколько промптов

```typescript
import { PromptConvFromString } from 'vv-ai-prompt-format'

const text = `
$$begin
$$user
Первый промпт
$$end

$$begin
$$system
Другой системный промпт
$$user
Второй промпт
$$end
`

const prompts = PromptConvFromString(text)
console.log(prompts.length) // 2
```

### Работа с JSON Schema ответами

Секция `$$jsonresponse` позволяет определить JSON Schema для структурированного вывода ответа. Это полезно, когда нужно, чтобы AI возвращал данные в определённом формате:

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Сгенерируй профиль пользователя',
  jsonresponse: JSON.stringify({
    type: 'object',
    required: ['name', 'age'],
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      email: { type: 'string', format: 'email' }
    }
  })
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// Сгенерируй профиль пользователя
// $$jsonresponse
// {"type":"object","required":["name","age"],"properties":{"name":{"type":"string"},"age":{"type":"number"},"email":{"type":"string","format":"email"}}}
// $$end

const parsed = PromptConvFromString(text)
console.log(JSON.parse(parsed[0].jsonresponse)) // Доступ к JSON Schema
```

### Работа с сегментами

Сегменты позволяют хранить именованные блоки текста внутри промпта:

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Проанализируй этот код',
  segment: {
    code: 'function hello() { return "world"; }',
    tests: 'test("hello", () => { expect(hello()).toBe("world"); })'
  }
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// Проанализируй этот код
// $$segment=code
// function hello() { return "world"; }
// $$segment=tests
// test("hello", () => { expect(hello()).toBe("world"); })
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].segment.code) // Доступ к содержимому сегмента
```

### Работа с инструментами

Секция `$$tool` перечисляет имена инструментов — по одному на строку. Спецификация инструмента для модели указывается в отдельной секции `$$tool=spec=<имя>`, а inline-код — в `$$tool=<lang>=<имя>`.

Поддерживаются три режима выполнения в зависимости от наличия `$$tool=spec=` и секции с кодом:

#### 1. Серверный инструмент — сервис выполняет сам, spec не нужен

Сервис уже знает эти инструменты и умеет их выполнять. В `$$tool` передаются только имена, поле `spec` не указывается.

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Сколько будет 2 + 2?',
  tool: [
    { name: 'calculator' },
    { name: 'datetime' }
  ]
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// Сколько будет 2 + 2?
// $$tool
// calculator
// datetime
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].tool)
// [{ name: 'calculator' }, { name: 'datetime' }]
```

#### 2. Клиентский инструмент — выполняет клиент, spec обязателен

Сервис не знает код инструмента. Когда модель решает его вызвать, сервис запрашивает вызывающую сторону (клиента) выполнить вызов и вернуть результат. Поле `spec` сообщает модели, что делает инструмент и какие аргументы передавать.

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Найди последний релиз TypeScript',
  tool: [
    {
      name: 'search',
      spec: 'Ищет в интернете и возвращает результаты. Аргументы: query (string) — поисковый запрос'
    }
  ]
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// Найди последний релиз TypeScript
// $$tool
// search
// $$tool=spec=search
// Ищет в интернете и возвращает результаты. Аргументы: query (string) — поисковый запрос
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].tool)
// [{ name: 'search', spec: 'Ищет в интернете и возвращает результаты. Аргументы: query (string) — поисковый запрос' }]
```

#### 3. Inline-инструмент — сервис выполняет переданный код, spec обязателен

Код инструмента передаётся прямо в запросе через секцию `$$tool=<lang>=<имя>`. Сервис выполняет его самостоятельно. Поле `spec` по-прежнему обязательно, чтобы модель знала, когда и как вызывать инструмент. Значение `lang` — произвольная строка (например, `JS`, `PY`); библиотека не валидирует его.

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Сложи 5 и 7',
  tool: [
    {
      name: 'add',
      spec: 'Складывает два числа. Аргументы: a (number), b (number)',
      lang: 'JS',
      code: 'return args.a + args.b'
    }
  ]
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// Сложи 5 и 7
// $$tool
// add
// $$tool=spec=add
// Складывает два числа. Аргументы: a (number), b (number)
// $$tool=JS=add
// return args.a + args.b
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].tool)
// [{ name: 'add', spec: 'Складывает два числа. Аргументы: a (number), b (number)', lang: 'JS', code: 'return args.a + args.b' }]
```

### Работа с конфигурацией LLM

Секция `$$llm` позволяет указать URL эндпоинта LLM и название модели:

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  llm: {
    url: 'http://localhost:11434',
    model: 'llama2',
    gpulayer: 33
  },
  user: 'В чём смысл жизни?',
  options: {
    temperature: 0.7,
    maxTokens: 2048
  }
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$llm
// url=http://localhost:11434
// model=llama2
// gpulayer=33
// $$options
// temperature=0.7
// maxTokens=2048
// $$user
// В чём смысл жизни?
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].llm) // { url: 'http://localhost:11434', model: 'llama2', gpulayer: 33 }
```

## API

### Типы

```typescript
type TPromptOptions = {
  temperature?: number
  topP?: number
  topK?: number
  minP?: number
  maxTokens?: number
  repeatPenalty?: number
  repeatPenaltyNum?: number
  presencePenalty?: number
  frequencyPenalty?: number
  mirostat?: number
  mirostatTau?: number
  mirostatEta?: number
  penalizeNewline?: boolean
  stopSequences?: string[]
  trimWhitespace?: boolean
}

type TPromptTool = {
  name: string
  spec?: string    // описание для модели: что делает инструмент и какие аргументы передавать
  lang?: string    // язык программирования inline-кода (например, 'JS', 'PY')
  code?: string    // inline-код, выполняемый сервисом
}

type TPrompt = {
  system?: string
  user: string
  options?: TPromptOptions
  segment?: Record<string, string>
  jsonresponse?: string
  llm?: { url?: string; model?: string; gpulayer?: number }
  tool?: TPromptTool[]
}
```

#### Формат options

Секция `$$options` поддерживает различные форматы значений:

**Числа:**
- Десятичные: `0.7`, `2`, `2.4`
- С запятой: `0,7`, `2,4`
- В кавычках: `"0.7"`, `'0.9'`

**Булевы значения:**
- Стандартные: `true`, `false`
- Числовые: `1`, `0`
- Короткие: `y`, `n` (регистр не важен)
- В кавычках: `"true"`, `'false'`

**Массивы:**
- Формат JSON: `stopSequences=["stop1", "stop2"]`

**Undefined:**
- Пустое значение: `minP=` (параметр будет undefined)

### Функции

#### `PromptConvFromString(raw: string, use?: 'core' | 'json'): TPrompt[]`

Парсит текст и возвращает массив промптов.

**Параметры:**
- `raw` - Текст, содержащий промпты в указанном формате
- `use` - Тип схемы для валидации options (опционально, по умолчанию: `'core'`):
  - `'core'` - Стандартные настройки AI модели (выше temperature, креативность)
  - `'json'` - Настройки для структурированного JSON вывода (ниже temperature, детерминированность)

**Возвращает:**
- Массив объектов `TPrompt`

**Пример:**
```typescript
const prompts = PromptConvFromString(text, 'json') // Использовать JSON схему с дефолтами
```

#### `PromptOptionsParse(use: 'core' | 'json', raw?: object, useAllOptions?: boolean): TPromptOptions`

Парсит и валидирует опции промпта из сырого объекта.

**Параметры:**
- `use` - Тип схемы: `'core'` для стандартных AI моделей, `'json'` для структурированного JSON вывода
- `raw` - Сырой объект с значениями опций для парсинга (опционально)
- `useAllOptions` - Если `true`, возвращает все опции с дефолтами; если `false`, возвращает только указанные опции (опционально, по умолчанию: `true`)

**Возвращает:**
- Валидированный объект `TPromptOptions`. Невалидные значения заменяются на дефолтные. Никогда не выбрасывает ошибки.

**Пример:**
```typescript
// Получить все опции с дефолтами
const options = PromptOptionsParse('core', { temperature: 0.7 })
// Вернет: { temperature: 0.7, topP: 0.9, topK: 40, ... все остальные дефолты }

// Получить только указанные опции
const options = PromptOptionsParse('core', { temperature: 0.7 }, false)
// Вернет: { temperature: 0.7 }
```

#### `PromptConvToString(prompt: TPrompt[]): string`

Сериализует массив промптов в текстовый формат.

**Параметры:**
- `prompt` - Массив объектов `TPrompt`

**Возвращает:**
- Строка в указанном формате

## Лицензия

MIT