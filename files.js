import { access, readFile, writeFile, readdir, stat } from 'fs/promises';
import { constants } from 'fs';
import { resolve, join } from 'path';

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

async function processFiles(filePaths) {
    const validPaths = await getValidPaths(filePaths);
    const fileContents = await getContents(validPaths);
    return fileContents.join('\n Document this additional code using JSDoc \n');
}

export { checkFilePath, getFilesFromFolder, getValidPaths, getContents, setContents, processFiles, };