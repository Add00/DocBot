import os from 'os';

import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

import TOML from '@ltd/j-toml';

function showTokenUsage(response) {
    console.error(`
      TOKEN USAGE:
      ------------
      Completion Tokens: ${response.eval_count}
      Prompt Tokens: ${response.prompt_eval_count}
      Total Tokens: ${response.eval_count + response.prompt_eval_count}
      `);
}

// Function to parse TOML file
function tomlParser() {
    const tomlFile = join(os.homedir(), '.docbot-config.toml');

    if (!existsSync(tomlFile)) {
        return {};
    }

    try {
        const finalPath = resolve(tomlFile);
        const fileContents = readFileSync(finalPath, 'utf8');
        return TOML.parse(fileContents);
    } catch (error) {
        console.error(`Error parsing TOML file: ${error}`);
    }
}

function getConfigOrArgs(config, args) {
    return {
        model: args.model || config.model || 'gemma2:2b',
        output: args.output || config.output,
        baseUrl: args.baseUrl || config.baseUrl || 'http://127.0.0.1:11434',
        verbose: args.verbose || config.verbose || false,
        tokenUsage: args.tokenUsage || config.tokenUsage || false,
        stream: args.stream || config.stream || false,
    };
}

export {
    showTokenUsage,
    tomlParser,
    getConfigOrArgs,
}