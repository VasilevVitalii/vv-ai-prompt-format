<div id="badges">
  <a href="https://www.linkedin.com/in/vasilev-vitalii/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
  <a href="https://www.youtube.com/@user-gj9vk5ln5c/featured">
    <img src="https://img.shields.io/badge/YouTube-red?style=for-the-badge&logo=youtube&logoColor=white" alt="Youtube Badge"/>
  </a>
</div>

[Русский](readme.rus.md)

# vv-ai-prompt-format

A lightweight TypeScript library for storing and managing AI prompts in a simple text format.

## Features

- Simple text-based format for storing prompts
- Support for system and user prompts
- Custom parameters for each prompt
- Multiple prompts in a single file
- Parse and serialize prompts to/from text
- Tool calling support: server-side, client-side and inline execution modes

## Installation

```bash
npm install vv-ai-prompt-format
```

## Format

The library uses a simple text format with special markers:

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
System prompt text here
$$user
User prompt text here
$$jsonresponse
{"type": "object", "properties": {"name": {"type": "string"}}}
$$segment=segmentName
Segment content here
$$tool
[{"name":"calculator"},{"name":"search","spec":"Searches the web. Args: query (string)"}]
$$tool=JS=search
return await fetch(`https://api.search.com?q=${args.query}`).then(r => r.json())
$$end
```

### Format rules:

- `$$begin` - Start of a prompt block
- `$$end` - End of a prompt block
- `$$user` - User prompt (required)
- `$$system` - System prompt (optional)
- `$$llm` - LLM configuration with url, model and gpulayer (optional)
- `$$options` - LLM settings section (optional)
- `$$jsonresponse` - JSON Schema for structured response output (optional)
- `$$segment=name` - Named text segments (optional)
- `$$tool` - List of tools available for the model (optional)
- `$$tool=<lang>=<name>` - Inline code for a tool (optional, requires a matching entry with `spec` in `$$tool`)
- Text before the first `$$begin` and after the last `$$end` is ignored
- Section order within a block doesn't matter
- All sections except `$$user` are optional
- Multiple segments with different names can be defined

## Usage

### Parsing prompts from text

```typescript
import { PromptConvFromString } from 'vv-ai-prompt-format'

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

const prompts = PromptConvFromString(text)
console.log(prompts)
// [{
//   system: 'You are a helpful assistant',
//   user: 'What is 2+2?',
//   options: { temperature: 0.7, maxTokens: 4096 }
// }]
```

### Serializing prompts to text

```typescript
import { PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  system: 'You are a helpful assistant',
  user: 'Hello, world!',
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
// You are a helpful assistant
// $$user
// Hello, world!
// $$end
```

### Multiple prompts

```typescript
import { PromptConvFromString } from 'vv-ai-prompt-format'

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

const prompts = PromptConvFromString(text)
console.log(prompts.length) // 2
```

### Working with JSON Schema responses

The `$$jsonresponse` section allows you to define a JSON Schema for structured response output. This is useful when you need the AI to return data in a specific format:

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Generate a user profile',
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
// Generate a user profile
// $$jsonresponse
// {"type":"object","required":["name","age"],"properties":{"name":{"type":"string"},"age":{"type":"number"},"email":{"type":"string","format":"email"}}}
// $$end

const parsed = PromptConvFromString(text)
console.log(JSON.parse(parsed[0].jsonresponse)) // Access the JSON Schema
```

### Working with segments

Segments allow you to store named blocks of text within a prompt:

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Analyze this code',
  segment: {
    code: 'function hello() { return "world"; }',
    tests: 'test("hello", () => { expect(hello()).toBe("world"); })'
  }
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// Analyze this code
// $$segment=code
// function hello() { return "world"; }
// $$segment=tests
// test("hello", () => { expect(hello()).toBe("world"); })
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].segment.code) // Access segment content
```

### Working with tools

The `$$tool` section defines a list of tools available to the model. Each tool is an object with `name` and optional `spec` fields. The `spec` field is a free-form description for the model explaining what the tool does and what arguments to pass.

Three execution modes are supported depending on the presence of `spec` and a code section:

#### 1. Server-side tools — service executes, no spec needed

The service already knows these tools. Only the tool names are passed. The `spec` field is omitted.

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'What is 2 + 2?',
  tool: [
    { name: 'calculator' },
    { name: 'datetime' }
  ]
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// What is 2 + 2?
// $$tool
// [{"name":"calculator"},{"name":"datetime"}]
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].tool)
// [{ name: 'calculator' }, { name: 'datetime' }]
```

#### 2. Client-side tools — client executes, spec required

The service has no code for the tool. When the model decides to call it, the service asks the requesting party (the client) to execute it and return the result. The `spec` tells the model what the tool does and what arguments to provide.

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Search for the latest TypeScript release',
  tool: [
    {
      name: 'search',
      spec: 'Searches the web and returns results. Args: query (string) — search query'
    }
  ]
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// Search for the latest TypeScript release
// $$tool
// [{"name":"search","spec":"Searches the web and returns results. Args: query (string) — search query"}]
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].tool)
// [{ name: 'search', spec: 'Searches the web and returns results. Args: query (string) — search query' }]
```

#### 3. Inline tools — service executes provided code, spec required

The tool code is delivered directly in the request via a `$$tool=<lang>=<name>` section. The service executes the code itself. The `spec` field is still required for the model to know when and how to call the tool. The `lang` value is a free-form string (e.g. `JS`, `PY`) — the library does not validate it.

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  user: 'Add 5 and 7',
  tool: [
    {
      name: 'add',
      spec: 'Adds two numbers. Args: a (number), b (number)',
      lang: 'JS',
      code: 'return args.a + args.b'
    }
  ]
}]

const text = PromptConvToString(prompts)
console.log(text)
// $$begin
// $$user
// Add 5 and 7
// $$tool
// [{"name":"add","spec":"Adds two numbers. Args: a (number), b (number)"}]
// $$tool=JS=add
// return args.a + args.b
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].tool)
// [{ name: 'add', spec: 'Adds two numbers. Args: a (number), b (number)', lang: 'JS', code: 'return args.a + args.b' }]
```

### Working with LLM configuration

The `$$llm` section allows you to specify the LLM endpoint URL and model name:

```typescript
import { PromptConvFromString, PromptConvToString, TPrompt } from 'vv-ai-prompt-format'

const prompts: TPrompt[] = [{
  llm: {
    url: 'http://localhost:11434',
    model: 'llama2',
    gpulayer: 33
  },
  user: 'What is the meaning of life?',
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
// What is the meaning of life?
// $$end

const parsed = PromptConvFromString(text)
console.log(parsed[0].llm) // { url: 'http://localhost:11434', model: 'llama2', gpulayer: 33 }
```

## API

### Types

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
  spec?: string    // description for the model: what the tool does and what args to pass
  lang?: string    // programming language of inline code (e.g. 'JS', 'PY')
  code?: string    // inline code executed by the service
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

#### `PromptConvFromString(raw: string, use?: 'core' | 'json'): TPrompt[]`

Parses text and returns an array of prompts.

**Parameters:**
- `raw` - Text containing prompts in the specified format
- `use` - Schema type for options validation (optional, default: `'core'`):
  - `'core'` - Standard AI model settings (higher temperature, creativity)
  - `'json'` - Structured JSON output settings (lower temperature, deterministic)

**Returns:**
- Array of `TPrompt` objects

**Example:**
```typescript
const prompts = PromptConvFromString(text, 'json') // Use JSON schema defaults
```

#### `PromptOptionsParse(use: 'core' | 'json', raw?: object, useAllOptions?: boolean): TPromptOptions`

Parses and validates prompt options from a raw object.

**Parameters:**
- `use` - Schema type: `'core'` for standard AI models, `'json'` for structured JSON output
- `raw` - Raw object containing option values to parse (optional)
- `useAllOptions` - If `true`, returns all options with defaults; if `false`, returns only specified options (optional, default: `true`)

**Returns:**
- Validated `TPromptOptions` object. Invalid values are replaced with defaults. Never throws errors.

**Example:**
```typescript
// Get all options with defaults
const options = PromptOptionsParse('core', { temperature: 0.7 })
// Returns: { temperature: 0.7, topP: 0.9, topK: 40, ... all other defaults }

// Get only specified options
const options = PromptOptionsParse('core', { temperature: 0.7 }, false)
// Returns: { temperature: 0.7 }
```

#### `PromptConvToString(prompt: TPrompt[]): string`

Serializes an array of prompts to text format.

**Parameters:**
- `prompt` - Array of `TPrompt` objects

**Returns:**
- String in the specified format

## License

MIT