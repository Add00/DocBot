#!/usr/bin/env node

import { access, readFile, writeFile, readdir, stat } from 'fs/promises';
import { constants, readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import os from 'os';

import { hideBin } from 'yargs/helpers';
import { oraPromise } from 'ora';
import { Ollama } from 'ollama';
import yargs from 'yargs';
import TOML from '@ltd/j-toml';

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

// Recursively get all files in a directory
async function getFilesFromFolder(dirPath) {
  let files = [];
  const items = await readdir(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = join(dirPath, item.name);
    if (item.isDirectory()) {
      const nestedFiles = await getFilesFromFolder(fullPath);
      files = files.concat(nestedFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

// Process all file paths and get valid paths
async function getValidPaths(filePaths) {
  let results = [];

  for (const filePath of filePaths) {
    const fullPath = await checkFilePath(filePath);
    const pathStat = await stat(fullPath);

    if (pathStat.isDirectory()) {
      const dirFiles = await getFilesFromFolder(fullPath);
      results = results.concat(dirFiles);
    } else {
      results.push(fullPath);
    }
  }

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
  }
  catch (error) {
    console.error(`Error parsing TOML file: ${error}`);
  }
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
    .option('stream', {
      alias: 's',
      type: 'boolean',
      description: 'Show the response as it generates',
      default: false
    })
    .parse();

  const ignory = new Ignory();
  
  const tomlConfig = tomlParser();
  const model =  args.model || tomlConfig.model;
  const output =  args.output || tomlConfig.output;
  const baseUrl =  args.baseUrl || tomlConfig.baseUrl;
  const verbose =  args.verbose || tomlConfig.verbose;
  const tokenUsage =  args.tokenUsage || tomlConfig.tokenUsage;
  const stream =  args.stream || tomlConfig.stream;

  const loggy = new Loggy(verbose);
  const ollama = new Ollama({ host: baseUrl });

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

  if (output === null || output === undefined) {
    const response = await oraPromise(async () => {
      return await ollama.chat({
        stream: stream,
        model: model,
        messages: [{ role: 'user', content: `Document the following code using JSDoc:\n ${contents}` }],
      })
    },
      {
        text: 'Processing...',
      }
    );

    if (stream) {
      for await (const part of response) {
        process.stdout.write(part.message.content)

        if (tokenUsage && part.done) {
          showTokenUsage(part);
        }
      }
    }
    else {
      console.log(response.message.content);
    }
  }
  else {
    const response = await oraPromise(async () => {
      return await ollama.chat({
        model: model,
        messages: [{ role: 'user', content: `Document the following code using JSDoc:\n ${contents}` }],
      })
    },
      {
        text: 'Processing...',
      },
    );

    const success = setContents(output, response.message.content);

    if (success) {
      console.log(`File created and content written to ${output}`);
    }
    else {
      console.error(`File could not be created: ${output}`);
    }

    if (tokenUsage) {
      showTokenUsage(response);
    }
  }
}

main()
  .catch(err => {
    console.error('Error processing files:', err);
  });
