#!/usr/bin/env node

import { access, readFile, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { resolve } from 'path';

import { hideBin } from 'yargs/helpers';
import { oraPromise } from 'ora';
import { Ollama } from 'ollama';
import yargs from 'yargs';

import { Loggy } from './loggy.js';

// Check file existence
async function checkFilePath(filePath) {
  const fullPath = resolve(filePath);

  try {
    await access(fullPath, constants.F_OK);

    return fullPath;
  } catch (err) {
    console.error(`File not found: ${fullPath}`);

    process.exit(1);
  }
}

// Process all file paths and get valid paths
async function getValidPaths(filePaths) {
  const results = await Promise.all(filePaths.map(checkFilePath));

  return results.filter(path => path !== null);
}

// Function to read file contents
async function getContents(filePaths) {
  const readPromises = filePaths.map(async (filePath) => {
    try {
      const content = await readFile(filePath, 'utf-8');

      return content;
    } catch (err) {
      console.error(`Error reading file ${filePath}: ${err.message}`);

      return null;
    }
  });

  const contents = await Promise.all(readPromises);
  return contents.filter(content => content !== null);
}

async function setContents(filePath, content) {
  try {
    await writeFile(filePath, content, 'utf8');

  } catch (error) {
    console.error(`Error writing to file: ${error}`);

    return null;
  }
}

function showTokenUsage(response) {
  console.error(`
    TOKEN USAGE:
    ------------
    Completion Tokens: ${response.eval_count}
    Prompt Tokens: ${response.prompt_eval_count}
    Total Tokens: ${response.eval_count + response.prompt_eval_count}
    `);
}

// Main function to execute the logic
async function main() {
  const args = yargs(hideBin(process.argv))
    .alias('h', 'help')
    .alias('v', 'version')
    .command('$0 [files...]', 'Files to process', (yargs) => {
      yargs.positional('file', {
        describe: 'The files to process',
        type: 'string',
        demandOption: true
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
    .parse();

  const loggy = new Loggy(args.verbose);
  const ollama = new Ollama({ host: args.baseUrl });

  loggy.show(args);

  const filePaths = args.files;

  if (filePaths.length === 0) {
    loggy.show('No file paths provided.', 'err');
    process.exit(1);
  }

  const validPaths = await getValidPaths(filePaths);
  loggy.show(`Valid file paths: ${validPaths}`);

  const fileContents = await getContents(validPaths);
  loggy.show(`Valid file paths: ${fileContents}`);

  const contents = fileContents.join('\n Document this additional code using JSDoc \n');

  console.log(contents);

  if (args.output === null) {
    const response = await ollama.chat({
      stream: true,
      model: args.model,
      messages: [{ role: 'user', content: `Document the following code using JSDoc:\n ${contents}` }],
    });

    for await (const part of response) {
      process.stdout.write(part.message.content)

      if (args.tokenUsage && part.done) {
        showTokenUsage(part);
      }
    }
  }
  else {
    const response = await oraPromise(async () => {
      return await ollama.chat({
        model: args.model,
        messages: [{ role: 'user', content: `Document the following code using JSDoc:\n ${contents}` }],
      })
    },
      {
        text: 'Processing...',
      },
    );
    
    const success = setContents(args.output, response.message.content);

    if (success) {
      console.log(`File created and content written to ${args.output}`);
    }
    else {
      console.error(`File could not be created: ${args.output}`);
    }

    if (args.tokenUsage) {
      showTokenUsage(response);
    }
  }
}

main()
  .catch(err => {
    console.error('Error processing files:', err);
  });
