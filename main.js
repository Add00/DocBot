#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import os from 'os';

import { hideBin } from 'yargs/helpers';
import { oraPromise } from 'ora';
import { Ollama } from 'ollama';
import yargs from 'yargs';
import TOML from '@ltd/j-toml';

import { Loggy } from './loggy.js';
import * as file from './files.js';

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

const chat = {
  talk: async (stream, model, contents) => {
    return await Ollama.chat({
      stream: stream,
      model: model,
      messages: [
        {
          role: 'user',
          content: `Document the following code using JSDoc:\n ${contents}`,
        },
      ],
    });
  },
  text: 'Processing...',
};

// Main function to execute the logic
async function main() {
  const args = yargs(hideBin(process.argv))
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

  const config = tomlParser();
  const { model, output, baseUrl, verbose, tokenUsage, stream } =
    getConfigOrArgs(config, args);

  const loggy = new Loggy(verbose);
  const ollama = new Ollama({ host: baseUrl });

  loggy.show(args);

  const filePaths = args.files;

  if (filePaths.length === 0) {
    loggy.show('No file paths provided.', 'err');
    process.exit(1);
  }

  const validPaths = await file.getValidPaths(filePaths);
  loggy.show(`Valid file paths: ${validPaths}`);

  const fileContents = await file.getContents(validPaths);
  loggy.show(`Valid file paths: ${fileContents}`);

  const contents = fileContents.join(
    '\n Document this additional code using JSDoc \n'
  );

  console.log(contents);

  if (output === null || output === undefined) {
    const response = await oraPromise(
      chat.talk(stream, model, contents),
      chat.text
    );

    if (stream) {
      for await (const part of response) {
        process.stdout.write(part.message.content);

        if (tokenUsage && part.done) {
          showTokenUsage(part);
        }
      }
    } else {
      console.log(response.message.content);
    }
  } else {
    const response = await oraPromise(
      chat.talk(stream, model, contents),
      chat.text
    );

    const success = file.setContents(output, response.message.content);

    if (success) {
      console.log(`File created and content written to ${output}`);
    } else {
      console.error(`File could not be created: ${output}`);
    }

    if (tokenUsage) {
      showTokenUsage(response);
    }
  }
}

main().catch((err) => {
  console.error('Error processing files:', err);
});
