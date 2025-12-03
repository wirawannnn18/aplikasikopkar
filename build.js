import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create public directory
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Files and directories to copy
const itemsToCopy = [
    'index.html',
    'js',
    'css'
];

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy files
for (const item of itemsToCopy) {
    const srcPath = path.join(__dirname, item);
    const destPath = path.join(publicDir, item);
    
    if (fs.existsSync(srcPath)) {
        const stats = fs.statSync(srcPath);
        
        if (stats.isDirectory()) {
            console.log(`Copying directory: ${item}`);
            copyDir(srcPath, destPath);
        } else {
            console.log(`Copying file: ${item}`);
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('Build completed successfully!');
console.log('Output directory: public/');
