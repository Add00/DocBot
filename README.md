# README

**DocBot** is a command-line tool designed to help you automatically document your code! It's flexible, allowing you to select different models for documentation generation, output options, and more.

## Features

- **Easy to Use**: Document your code with a single command.
- **Model Selection**: Choose different AI models for documentation.
- **Customizable**: Change output filenames, base URLs, and enable verbose logging.
- **TOML support**: Define a `.docbot-config.toml` file in your home directory (`~`) to define personalized configuration settings such as the default model, output file, base url, logging preferences, base API URLs, and output file path.

## Prerequisites

Before installing, make sure you have the following:

1. [Node.js](https://nodejs.org/en) (v14 or higher recommended)
2. [Ollama](https://ollama.com/) (Optional, required if using the `gemma2` model or others from Ollama)

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:Add00/DocBot.git
   cd DocBot
   ```
2. (Optional) Run Ollama with the default model:

   ```bash
   ollama run gemma2:2b
   ```

   > _Note_: This step is only necessary if you're using the gemma2:2b model. You can select a different model manually using the -m flag during usage.

3. Run DocBot:
   ```bash
   npm run docbot -- [files...]
   ```

## Usage

`npm run docbot -- [files...]`

| **Option**       | **Description**                                          | **Type**  | **Default**                |
| ---------------- | -------------------------------------------------------- | --------- | -------------------------- |
| `-m, --model`    | Select a different model, make sure that it is available | `string`  | `"gemma2:2b"`              |
| `-o, --output`   | Change the name of the output file                       | `string`  | `null`                     |
| `-b, --base-url` | Change the base-url, defaults to localhost               | `string`  | `"http://127.0.0.1:11434"` |
| `-V, --verbose`  | Run with verbose logging                                 | `boolean` | `false`                    |
| `-h, --help`     | Show help                                                | `boolean` |                            |
| `-v, --version`  | Show version number                                      | `boolean` |                            |

## TOML Configuration

You can create a [TOML](https://toml.io/en/) config file named `.docbot-config.toml` that contains all your configuration for the tool and place it in your `home` directory.

Here is an example TOML file you can use:

```toml
model = "gemma2:2b"
baseUrl = "http://127.0.0.1:11434"
verbose = false
tokenUsage = false
stream = false
```

## Examples

- Basic usage with default settings: `npm run docbot -- myFile.js`
- Specify a custom model and output file: `npm run docbot -- myFile.js -m llama2 -o docs.md`
- Run with verbose logging: `npm run docbot -- myFile.js -V`

## Licence

This project is licensed under the MIT License.
