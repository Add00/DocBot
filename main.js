#!/usr/bin/env node

import process from 'process';

import { oraPromise } from 'ora';
import { Ollama } from 'ollama';

import { Chat } from './chat.js';
import { Loggy } from './loggy.js';
import * as file from './files.js';
import * as utils from './utils.js';

// Main function to execute the logic
async function main() {
  const args = utils.parseArgs();

  const config = utils.tomlParser();
  const { 
    model, 
    output, 
    baseUrl, 
    verbose, 
    tokenUsage, 
    stream, 
  } = utils.getConfigOrArgs(config, args);

  const loggy = new Loggy(verbose);
  const ollama = new Ollama({ host: baseUrl });
  const chat = new Chat(ollama);

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
          utils.showTokenUsage(part);
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
      utils.showTokenUsage(response);
    }
  }
}

main().catch((err) => {
  console.error('Error processing files:', err);
});
