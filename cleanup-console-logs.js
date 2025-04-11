/**
 * This script removes console.log statements from all TypeScript and JavaScript files
 * in the src directory. It's meant to be run as a one-time cleanup before production.
 */

const fs = require('fs');
const path = require('path');

// Function to recursively get all files in a directory
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (
      filePath.endsWith('.ts') || 
      filePath.endsWith('.tsx') || 
      filePath.endsWith('.js') || 
      filePath.endsWith('.jsx')
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to remove console.log statements from a file
function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Count original console statements
    const originalConsoleCount = (content.match(/console\.(log|error|warn|info|debug)/g) || []).length;
    
    if (originalConsoleCount === 0) {
      return { filePath, removed: 0 };
    }
    
    // Replace console.log statements
    const newContent = content.replace(/console\.log\s*\([^;]*\);?/g, '');
    
    // Count remaining console statements (error, warn, etc.)
    const remainingConsoleCount = (newContent.match(/console\.(error|warn|info|debug)/g) || []).length;
    
    // Calculate how many were removed
    const removedCount = originalConsoleCount - remainingConsoleCount;
    
    // Only write the file if changes were made
    if (removedCount > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
    
    return { filePath, removed: removedCount };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { filePath, removed: 0, error: error.message };
  }
}

// Main function
function main() {
  const srcDir = path.join(__dirname, 'src');
  const files = getAllFiles(srcDir);
  
  console.log(`Found ${files.length} files to process`);
  
  let totalRemoved = 0;
  const results = [];
  
  files.forEach(file => {
    const result = removeConsoleLogs(file);
    if (result.removed > 0) {
      results.push(result);
      totalRemoved += result.removed;
    }
  });
  
  console.log(`Removed ${totalRemoved} console.log statements from ${results.length} files`);
  
  if (results.length > 0) {
    console.log('\nFiles modified:');
    results.forEach(result => {
      console.log(`- ${path.relative(__dirname, result.filePath)}: ${result.removed} statements removed`);
    });
  }
}

main();
