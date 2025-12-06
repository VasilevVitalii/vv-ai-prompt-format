<div id="badges">
  <a href="https://www.linkedin.com/in/vasilev-vitalii/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
  <a href="https://www.youtube.com/@user-gj9vk5ln5c/featured">
    <img src="https://img.shields.io/badge/YouTube-red?style=for-the-badge&logo=youtube&logoColor=white" alt="Youtube Badge"/>
  </a>
</div>

[Русский](readme.rus.md)

# vv-ai-promt-store

A lightweight TypeScript library for storing and managing AI prompts in a simple text format.

## Features

- Simple text-based format for storing prompts
- Support for system and user prompts
- Custom parameters for each prompt
- Multiple prompts in a single file
- Parse and serialize prompts to/from text

## Installation

```bash
npm install vv-ai-promt-store
```

## Format

The library uses a simple text format with special markers:

```
$$begin
$$@key=value
$$system
System prompt text here
$$user
User prompt text here
$$end
```

### Format rules:

- `$$begin` - Start of a prompt block
- `$$end` - End of a prompt block
- `$$user` - User prompt (required)
- `$$system` - System prompt (optional)
- `$$@key=value` - Custom parameters (optional)
- Text before the first `$$begin` and after the last `$$end` is ignored
- Section order within a block doesn't matter
- All sections except `$$user` are optional

## Usage

### Parsing prompts from text

```typescript
import { PromtLoad } from 'vv-ai-promt-store'

const text = `
$$begin
$$@model=gpt-4
$$system
You are a helpful assistant
$$user
What is 2+2?
$$end
`

const prompts = PromtLoad(text)
console.log(prompts)
// [{
//   system: 'You are a helpful assistant',
//   user: 'What is 2+2?',
//   param: { model: 'gpt-4' }
// }]
```

### Serializing prompts to text

```typescript
import { PromtStore, TPromt } from 'vv-ai-promt-store'

const prompts: TPromt[] = [{
  system: 'You are a helpful assistant',
  user: 'Hello, world!',
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
// You are a helpful assistant
// $$user
// Hello, world!
// $$end
```

### Multiple prompts

```typescript
import { PromtLoad } from 'vv-ai-promt-store'

const text = `
$$begin
$$user
First prompt
$$end

$$begin
$$system
Different system prompt
$$user
Second prompt
$$end
`

const prompts = PromtLoad(text)
console.log(prompts.length) // 2
```

## API

### Types

```typescript
type TPromt = {
  system?: string
  user: string
  param?: Record<string, string>
}
```

### Functions

#### `PromtLoad(raw: string): TPromt[]`

Parses text and returns an array of prompts.

**Parameters:**
- `raw` - Text containing prompts in the specified format

**Returns:**
- Array of `TPromt` objects

#### `PromtStore(promt: TPromt[]): string`

Serializes an array of prompts to text format.

**Parameters:**
- `promt` - Array of `TPromt` objects

**Returns:**
- String in the specified format

## License

MIT