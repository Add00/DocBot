import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import process from 'process';

import { hideBin } from 'yargs/helpers';

import { showTokenUsage, tomlParser, getConfigOrArgs, parseArgs } from '../utils.js';

// Mock modules
vi.mock('fs');
vi.mock('path');
vi.mock('os');

describe('showTokenUsage', () => {
  it('should log token usage statistics to the console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = { eval_count: 100, prompt_eval_count: 50 };

    showTokenUsage(response);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('TOKEN USAGE'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Completion Tokens: 100'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Prompt Tokens: 50'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Total Tokens: 150'));

    consoleErrorSpy.mockRestore();
  });
});

describe('tomlParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return an empty object if the TOML file does not exist', () => {
    existsSync.mockReturnValue(false);
    const result = tomlParser();
    expect(result).toEqual({});
  });

  it('should parse and return the contents of the TOML file if it exists', () => {
    const tomlContent = 'model = "gemma2:2b"\noutput = "output.log"';
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(tomlContent);
    resolve.mockReturnValue('/path/to/.docbot-config.toml');

    const parsedConfig = tomlParser();
    expect(parsedConfig).toHaveProperty('model', 'gemma2:2b');
    expect(parsedConfig).toHaveProperty('output', 'output.log');
  });

  it('should log an error if parsing fails', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockImplementation(() => { throw new Error('Parsing error'); });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    tomlParser();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error parsing TOML file:'));
    consoleErrorSpy.mockRestore();
  });
});

describe('getConfigOrArgs', () => {
  it('should use values from args if provided, otherwise use configuration values', () => {
    const config = { model: 'gemma2:2b', output: 'output.log', verbose: true };
    const args = { model: 'customModel', verbose: false };

    const result = getConfigOrArgs(config, args);

    expect(result.model).toBe('customModel');
    expect(result.output).toBe('output.log');
    expect(result.verbose).toBe(true);
  });

  it('should apply default values if neither args nor config provide values', () => {
    const result = getConfigOrArgs({}, {});
    expect(result.model).toBe('gemma2:2b');
    expect(result.baseUrl).toBe('http://127.0.0.1:11434');
    expect(result.verbose).toBe(false);
    expect(result.tokenUsage).toBe(false);
    expect(result.stream).toBe(false);
  });
});


describe('parseArgs', () => {
  it('should parse default options correctly', () => {
    const args = parseArgs(hideBin(process.argv));

    expect(args.model).toBe('gemma2:2b');
    expect(args.output).toBe(null);
    expect(args['base-url']).toBe('http://127.0.0.1:11434');
    expect(args.verbose).toBe(false);
    expect(args['token-usage']).toBe(false);
    expect(args.stream).toBe(false);
  });

  it('should parse command line arguments correctly', () => {
    const argv = hideBin(['node', 'script.js', '--model', 'customModel', '--output', 'result.txt', '--verbose']);
    console.log(argv);
    const args = parseArgs(argv);
    console.log(args);

    expect(args.model).toBe('customModel');
    expect(args.output).toBe('result.txt');
    expect(args.verbose).toBe(true);
  });

  it('should handle positional file arguments', () => {
    const argv = hideBin(['node', 'script.js', 'file1.txt', 'file2.txt']);
    console.log(argv);
    const args = parseArgs(argv);
    console.log(args);

    expect(args.files).toEqual(['file1.txt', 'file2.txt']);
  });

  it('should parse all options correctly when provided in args', () => {
    const argv = hideBin([
      'node', 
      'script.js', 
      '--model', 'testModel', 
      '--output', 'output.txt', 
      '--base-url', 'http://localhost:3000', 
      '--verbose', 
      '--token-usage', 
      '--stream'
    ]);
    const args = parseArgs(argv);

    expect(args.model).toBe('testModel');
    expect(args.output).toBe('output.txt');
    expect(args['base-url']).toBe('http://localhost:3000');
    expect(args.verbose).toBe(true);
    expect(args['token-usage']).toBe(true);
    expect(args.stream).toBe(true);
  });
});