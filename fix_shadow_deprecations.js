#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to convert shadow properties to boxShadow
function convertShadowToBoxShadow(content) {
  // Pattern to match shadow properties block
  const shadowPattern = /shadowColor:\s*['"`]([^'"`]*?)['"`],?\s*shadowOffset:\s*\{\s*width:\s*(\d+),?\s*height:\s*(\d+),?\s*\},?\s*shadowOpacity:\s*([\d.]+),?\s*shadowRadius:\s*([\d.]+),?/g;
  
  return content.replace(shadowPattern, (match, color, width, height, opacity, radius) => {
    // Convert to boxShadow format: offsetX offsetY blurRadius spreadRadius color
    return `boxShadow: '${width}px ${height}px ${radius}px 0px ${color.replace(/rgba\(([\d,.\s]+),\s*([\d.]+)\)/, (m, rgb, alpha) => {
      const finalOpacity = parseFloat(alpha) * parseFloat(opacity);
      return `rgba(${rgb}, ${finalOpacity})`;
    }).replace(/rgb\(([\d,.\s]+)\)/, (m, rgb) => {
      return `rgba(${rgb}, ${opacity})`;
    }).replace(/^#/, () => {
      // Convert hex to rgba if needed
      const hex = color.replace('#', '');
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else if (hex.length === 6) {
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return color;
    })}',`;
  });
}

// Function to process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = convertShadowToBoxShadow(content);
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed shadow properties in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and process files
function processDirectory(dirPath, extensions = ['.tsx', '.ts', '.js', '.jsx']) {
  let processedFiles = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        if (processFile(fullPath)) {
          processedFiles++;
        }
      }
    }
  }
  
  walkDir(dirPath);
  return processedFiles;
}

// Main execution
console.log('🔧 Starting shadow property deprecation fix...\n');

const appDir = path.join(__dirname, 'app');
const componentsDir = path.join(__dirname, 'components');

let totalFixed = 0;

if (fs.existsSync(appDir)) {
  console.log('Processing app directory...');
  totalFixed += processDirectory(appDir);
}

if (fs.existsSync(componentsDir)) {
  console.log('Processing components directory...');
  totalFixed += processDirectory(componentsDir);
}

console.log(`\n🎉 Complete! Fixed shadow properties in ${totalFixed} files.`);

if (totalFixed === 0) {
  console.log('ℹ️ No shadow deprecation issues found or all files already use modern syntax.');
} else {
  console.log('✅ All deprecated shadow properties have been converted to modern boxShadow syntax.');
  console.log('🚀 You can now run the app without shadow deprecation warnings!');
}
