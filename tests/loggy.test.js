import { describe, it, expect, vi } from 'vitest';
import { Loggy } from '../loggy.js';

describe('Loggy', () => {
  it('should not log anything when verbose is false', () => {
    const loggy = new Loggy(false);
    const consoleLogSpy = vi.spyOn(console, 'log');
    const consoleErrorSpy = vi.spyOn(console, 'error');

    loggy.show('This message should not log');

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log to console.log when verbose is true and mode is "out"', () => {
    const loggy = new Loggy(true);
    const consoleLogSpy = vi.spyOn(console, 'log');

    loggy.show('This is an output message', 'out');

    expect(consoleLogSpy).toHaveBeenCalledWith('This is an output message');

    consoleLogSpy.mockRestore();
  });

  it('should log to console.error when verbose is true and mode is "err"', () => {
    const loggy = new Loggy(true);
    const consoleErrorSpy = vi.spyOn(console, 'error');

    loggy.show('This is an error message', 'err');

    expect(consoleErrorSpy).toHaveBeenCalledWith('This is an error message');

    consoleErrorSpy.mockRestore();
  });

  it('should throw an error for an undefined mode', () => {
    const loggy = new Loggy(true);

    expect(() => loggy.show('This should throw', 'invalid')).toThrow(
      "Undefined Loggy mode, must be 'out' or 'err'"
    );
  });
});
