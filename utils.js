import os from 'os';
import process from 'process';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

import { hideBin } from 'yargs/helpers';
import TOML from '@ltd/j-toml';
import yargs from 'yargs';

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

function parseArgs(args = hideBin(process.argv)) {
    yargs(args)
    .alias('h', 'help')
    .alias('v', 'version')
    .command('$0 [files...]', 'Files to process', (yargs) => {
      yargs.positional('file', {
        describe: 'The files to process',
        type: 'string',
        demandOption: true,
      });
    })
    .option('model', {
      alias: 'm',
      type: 'string',
      description: 'Select a different model, make sure that it is available',
      default: 'gemma2:2b',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Change the name of the output file',
      default: null,
    })
    .option('base-url', {
      alias: 'b',
      type: 'string',
      description: 'Change the base-url, defaults to localhost',
      default: 'http://127.0.0.1:11434',
    })
    .option('verbose', {
      alias: 'l',
      type: 'boolean',
      description: 'Run with verbose logging',
      default: false,
    })
    .option('token-usage', {
      alias: 't',
      type: 'boolean',
      description: 'Displays information about token usage',
      default: false,
    })
    .option('stream', {
      alias: 's',
      type: 'boolean',
      description: 'Show the response as it generates',
      default: false,
    })
    .parse();
}

export {
    showTokenUsage,
    tomlParser,
    getConfigOrArgs,
    parseArgs,
}