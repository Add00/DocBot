import { describe, it, expect, vi, beforeEach } from 'vitest';
import { access, readFile, writeFile, readdir, stat } from 'fs/promises';
import { constants } from 'fs';
import process from 'process';
import { checkFilePath, getFilesFromFolder, getValidPaths, getContents, setContents } from '../files.js'; 

vi.mock('fs/promises');

describe('File Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkFilePath', () => {
    it('should return the full path if the file exists', async () => {
      access.mockResolvedValueOnce();
      const filePath = '/path/to/file.txt';
      const result = await checkFilePath(filePath);
      expect(result).toBe(filePath);
      expect(access).toHaveBeenCalledWith(filePath, constants.F_OK);
    });

    it('should exit with code 1 if the file does not exist', async () => {
      access.mockRejectedValueOnce(new Error('File not found'));
      const filePath = '/path/to/nonexistent.txt';

      // Mock process.exit to prevent actual exit during the test
      const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await checkFilePath(filePath);
      expect(access).toHaveBeenCalledWith(filePath, constants.F_OK);
      expect(exitMock).toHaveBeenCalledWith(1);

      exitMock.mockRestore(); // Restore process.exit to original
    });
  });

  describe('getFilesFromFolder', () => {
    it('should return all files in a directory recursively', async () => {
      readdir.mockResolvedValueOnce([
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'subdir', isDirectory: () => true },
      ]);
      readdir.mockResolvedValueOnce([{ name: 'file2.txt', isDirectory: () => false }]);

      const dirPath = '/path/to/dir';
      const result = await getFilesFromFolder(dirPath);
      expect(result).toEqual([
        '/path/to/dir/file1.txt',
        '/path/to/dir/subdir/file2.txt'
      ]);
    });
  });

  describe('getValidPaths', () => {
    it('should return valid paths for files and directories', async () => {
      access.mockResolvedValue();
      stat.mockResolvedValueOnce({ isDirectory: () => false });
      stat.mockResolvedValueOnce({ isDirectory: () => true });
      readdir.mockResolvedValueOnce([{ name: 'nestedFile.txt', isDirectory: () => false }]);

      const filePaths = ['/path/to/file.txt', '/path/to/dir'];
      const result = await getValidPaths(filePaths);
      expect(result).toEqual([
        '/path/to/file.txt',
        '/path/to/dir/nestedFile.txt',
      ]);
    });
  });

  describe('getContents', () => {
    it('should read and return contents of files', async () => {
      readFile.mockResolvedValueOnce('File content 1');
      readFile.mockResolvedValueOnce('File content 2');

      const filePaths = ['/path/to/file1.txt', '/path/to/file2.txt'];
      const result = await getContents(filePaths);
      expect(result).toEqual(['File content 1', 'File content 2']);
    });

    it('should filter out files that cannot be read', async () => {
      readFile.mockResolvedValueOnce('File content 1');
      readFile.mockRejectedValueOnce(new Error('Read error'));

      const filePaths = ['/path/to/file1.txt', '/path/to/file2.txt'];
      const result = await getContents(filePaths);
      expect(result).toEqual(['File content 1']);
    });
  });

  describe('setContents', () => {
    it('should write content to a file', async () => {
      writeFile.mockResolvedValueOnce();
      const filePath = '/path/to/file.txt';
      const content = 'Some content';

      await setContents(filePath, content);
      expect(writeFile).toHaveBeenCalledWith(filePath, content, 'utf8');
    });

    it('should return null if an error occurs during writing', async () => {
      writeFile.mockRejectedValueOnce(new Error('Write error'));

      const filePath = '/path/to/file.txt';
      const result = await setContents(filePath, 'Some content');
      expect(result).toBeNull();
    });
  });
});
