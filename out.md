```javascript
/**
 * Reads the contents of multiple files asynchronously.
 * 
 * @param {string[]} filePaths - An array of file paths to read.
 * @returns {Promise<Array<{ content: string, filePath: string }>>} 
 */
async function getContents(filePaths) {
  const readPromises = filePaths.map(async (filePath) => {
    try {
      const content = await readFile(filePath, 'utf-8');
      return { content, filePath }; // Return a new object with content and file path
    } catch (err) {
      console.error(`Error reading file ${filePath}: ${err.message}`);
      return null;  // Return null if reading file fails
    }
  });
 
  // Wait for all promises to resolve before returning a result.
  const results = await Promise.all(readPromises);
  return results; 
}
```