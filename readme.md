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
$$options
temperature=0.7
maxTokens=4096
$$system
System prompt text here
$$user
User prompt text here
$$segment=segmentName
Segment content here
$$end
```

### Format rules:

- `$$begin` - Start of a prompt block
- `$$end` - End of a prompt block
- `$$user` - User prompt (required)
- `$$system` - System prompt (optional)
- `$$options` - LLM settings section (optional)
- `$$segment=name` - Named text segments (optional)
- Text before the first `$$begin` and after the last `$$end` is ignored
- Section order within a block doesn't matter
- All sections except `$$user` are optional
- Multiple segments with different names can be defined

## Usage

### Parsing prompts from text

```typescript
import { PromtLoad } from 'vv-ai-promt-store'

const text = `
$$begin
$$options
temperature=0.7
maxTokens=4096
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
//   options: { temperature: 0.7, maxTokens: 4096 }
// }]
```

### Serializing prompts to text

```typescript
import { PromtStore, TPromt } from 'vv-ai-promt-store'

const prompts: TPromt[] = [{
  system: 'You are a helpful assistant',
  user: 'Hello, world!',
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

### Working with segments

Segments allow you to store named blocks of text within a prompt:

```typescript
import { PromtLoad, PromtStore, TPromt } from 'vv-ai-promt-store'

const prompts: TPromt[] = [{
  user: 'Analyze this code',
  segment: {
    code: 'function hello() { return "world"; }',
    tests: 'test("hello", () => { expect(hello()).toBe("world"); })'
  }
}]

const text = PromtStore(prompts)
console.log(text)
// $$begin
// $$user
// Analyze this code
// $$segment=code
// function hello() { return "world"; }
// $$segment=tests
// test("hello", () => { expect(hello()).toBe("world"); })
// $$end

const parsed = PromtLoad(text)
console.log(parsed[0].segment.code) // Access segment content
```

## API

### Types

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

#### Options format

The `$$options` section supports various formats for values:

**Numbers:**
- Decimal: `0.7`, `2`, `2.4`
- With comma separator: `0,7`, `2,4`
- In quotes: `"0.7"`, `'0.9'`

**Booleans:**
- Standard: `true`, `false`
- Numeric: `1`, `0`
- Short: `y`, `n` (case insensitive)
- In quotes: `"true"`, `'false'`

**Arrays:**
- JSON format: `stopSequences=["stop1", "stop2"]`

**Undefined:**
- Empty value: `minP=` (parameter will be undefined)

### Functions

#### `PromtLoad(raw: string, use?: 'core' | 'json'): TPromt[]`

Parses text and returns an array of prompts.

**Parameters:**
- `raw` - Text containing prompts in the specified format
- `use` - Schema type for options validation (optional, default: `'core'`):
  - `'core'` - Standard AI model settings (higher temperature, creativity)
  - `'json'` - Structured JSON output settings (lower temperature, deterministic)

**Returns:**
- Array of `TPromt` objects

**Example:**
```typescript
const prompts = PromtLoad(text, 'json') // Use JSON schema defaults
```

#### `PromtOptionsParse(use: 'core' | 'json', raw?: object, useAllOptions?: boolean): TPromtOptions`

Parses and validates prompt options from a raw object.

**Parameters:**
- `use` - Schema type: `'core'` for standard AI models, `'json'` for structured JSON output
- `raw` - Raw object containing option values to parse (optional)
- `useAllOptions` - If `true`, returns all options with defaults; if `false`, returns only specified options (optional, default: `true`)

**Returns:**
- Validated `TPromtOptions` object. Invalid values are replaced with defaults. Never throws errors.

**Example:**
```typescript
// Get all options with defaults
const options = PromtOptionsParse('core', { temperature: 0.7 })
// Returns: { temperature: 0.7, topP: 0.9, topK: 40, ... all other defaults }

// Get only specified options
const options = PromtOptionsParse('core', { temperature: 0.7 }, false)
// Returns: { temperature: 0.7 }
```

#### `PromtStore(promt: TPromt[]): string`

Serializes an array of prompts to text format.

**Parameters:**
- `promt` - Array of `TPromt` objects

**Returns:**
- String in the specified format

## License

MIT