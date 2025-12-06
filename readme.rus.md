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
$$@ключ=значение
$$system
Текст системного промпта
$$user
Текст пользовательского промпта
$$end
```

### Правила формата:

- `$$begin` - Начало блока промпта
- `$$end` - Конец блока промпта
- `$$user` - Пользовательский промпт (обязательно)
- `$$system` - Системный промпт (опционально)
- `$$@ключ=значение` - Пользовательские параметры (опционально)
- Текст до первого `$$begin` и после последнего `$$end` игнорируется
- Порядок секций внутри блока не важен
- Все секции, кроме `$$user`, опциональны

## Использование

### Парсинг промптов из текста

```typescript
import { PromtLoad } from 'vv-ai-promt-store'

const text = `
$$begin
$$@model=gpt-4
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
//   param: { model: 'gpt-4' }
// }]
```

### Сериализация промптов в текст

```typescript
import { PromtStore, TPromt } from 'vv-ai-promt-store'

const prompts: TPromt[] = [{
  system: 'Ты полезный ассистент',
  user: 'Привет, мир!',
  param: {
    temperature: '0.7',
    model: 'gpt-4'
  }
}]

const text = PromtStore(prompts)
console.log(text)
// $$begin
// $$@temperature=0.7
// $$@model=gpt-4
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

## API

### Типы

```typescript
type TPromt = {
  system?: string
  user: string
  param?: Record<string, string>
}
```

### Функции

#### `PromtLoad(raw: string): TPromt[]`

Парсит текст и возвращает массив промптов.

**Параметры:**
- `raw` - Текст, содержащий промпты в указанном формате

**Возвращает:**
- Массив объектов `TPromt`

#### `PromtStore(promt: TPromt[]): string`

Сериализует массив промптов в текстовый формат.

**Параметры:**
- `promt` - Массив объектов `TPromt`

**Возвращает:**
- Строка в указанном формате

## Лицензия

MIT