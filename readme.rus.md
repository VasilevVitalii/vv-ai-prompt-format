<div id="badges">
  <a href="https://www.linkedin.com/in/vasilev-vitalii/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
  <a href="https://www.youtube.com/@user-gj9vk5ln5c/featured">
    <img src="https://img.shields.io/badge/YouTube-red?style=for-the-badge&logo=youtube&logoColor=white" alt="Youtube Badge"/>
  </a>
</div>

[English](readme.md)

# vv-ai-promt-store

Легковесная TypeScript библиотека для хранения и управления AI-промптами в простом текстовом формате.

## Возможности

- Простой текстовый формат для хранения промптов
- Поддержка системных и пользовательских промптов
- Пользовательские параметры для каждого промпта
- Несколько промптов в одном файле
- Парсинг и сериализация промптов в/из текста

## Установка

```bash
npm install vv-ai-promt-store
```

## Формат

Библиотека использует простой текстовый формат со специальными маркерами:

```
$$begin
$$options
temperature=0.7
maxTokens=4096
$$system
Текст системного промпта
$$user
Текст пользовательского промпта
$$segment=имяСегмента
Содержимое сегмента
$$end
```

### Правила формата:

- `$$begin` - Начало блока промпта
- `$$end` - Конец блока промпта
- `$$user` - Пользовательский промпт (обязательно)
- `$$system` - Системный промпт (опционально)
- `$$options` - Секция настроек LLM (опционально)
- `$$segment=имя` - Именованные текстовые сегменты (опционально)
- Текст до первого `$$begin` и после последнего `$$end` игнорируется
- Порядок секций внутри блока не важен
- Все секции, кроме `$$user`, опциональны
- Можно определить несколько сегментов с разными именами

## Использование

### Парсинг промптов из текста

```typescript
import { PromtLoad } from 'vv-ai-promt-store'

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

const prompts = PromtLoad(text)
console.log(prompts)
// [{
//   system: 'Ты полезный ассистент',
//   user: 'Сколько будет 2+2?',
//   options: { temperature: 0.7, maxTokens: 4096 }
// }]
```

### Сериализация промптов в текст

```typescript
import { PromtStore, TPromt } from 'vv-ai-promt-store'

const prompts: TPromt[] = [{
  system: 'Ты полезный ассистент',
  user: 'Привет, мир!',
  options: {
    temperature: 0.7,
    maxTokens: 4096
  }
}]

const text = PromtStore(prompts)
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
import { PromtLoad } from 'vv-ai-promt-store'

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

const prompts = PromtLoad(text)
console.log(prompts.length) // 2
```

### Работа с сегментами

Сегменты позволяют хранить именованные блоки текста внутри промпта:

```typescript
import { PromtLoad, PromtStore, TPromt } from 'vv-ai-promt-store'

const prompts: TPromt[] = [{
  user: 'Проанализируй этот код',
  segment: {
    code: 'function hello() { return "world"; }',
    tests: 'test("hello", () => { expect(hello()).toBe("world"); })'
  }
}]

const text = PromtStore(prompts)
console.log(text)
// $$begin
// $$user
// Проанализируй этот код
// $$segment=code
// function hello() { return "world"; }
// $$segment=tests
// test("hello", () => { expect(hello()).toBe("world"); })
// $$end

const parsed = PromtLoad(text)
console.log(parsed[0].segment.code) // Доступ к содержимому сегмента
```

## API

### Типы

```typescript
type TPromtOptions = {
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

type TPromt = {
  system?: string
  user: string
  options?: TPromtOptions
  segment?: Record<string, string>
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

#### `PromtLoad(raw: string, use?: 'core' | 'json'): TPromt[]`

Парсит текст и возвращает массив промптов.

**Параметры:**
- `raw` - Текст, содержащий промпты в указанном формате
- `use` - Тип схемы для валидации options (опционально, по умолчанию: `'core'`):
  - `'core'` - Стандартные настройки AI модели (выше temperature, креативность)
  - `'json'` - Настройки для структурированного JSON вывода (ниже temperature, детерминированность)

**Возвращает:**
- Массив объектов `TPromt`

**Пример:**
```typescript
const prompts = PromtLoad(text, 'json') // Использовать JSON схему с дефолтами
```

#### `PromtOptionsParse(use: 'core' | 'json', raw?: object, useAllOptions?: boolean): TPromtOptions`

Парсит и валидирует опции промпта из сырого объекта.

**Параметры:**
- `use` - Тип схемы: `'core'` для стандартных AI моделей, `'json'` для структурированного JSON вывода
- `raw` - Сырой объект с значениями опций для парсинга (опционально)
- `useAllOptions` - Если `true`, возвращает все опции с дефолтами; если `false`, возвращает только указанные опции (опционально, по умолчанию: `true`)

**Возвращает:**
- Валидированный объект `TPromtOptions`. Невалидные значения заменяются на дефолтные. Никогда не выбрасывает ошибки.

**Пример:**
```typescript
// Получить все опции с дефолтами
const options = PromtOptionsParse('core', { temperature: 0.7 })
// Вернет: { temperature: 0.7, topP: 0.9, topK: 40, ... все остальные дефолты }

// Получить только указанные опции
const options = PromtOptionsParse('core', { temperature: 0.7 }, false)
// Вернет: { temperature: 0.7 }
```

#### `PromtStore(promt: TPromt[]): string`

Сериализует массив промптов в текстовый формат.

**Параметры:**
- `promt` - Массив объектов `TPromt`

**Возвращает:**
- Строка в указанном формате

## Лицензия

MIT