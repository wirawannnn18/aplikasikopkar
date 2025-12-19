#!/usr/bin/env node

/**
 * Production Setup Script
 * Script untuk setup aplikasi ke production dengan database real
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Warna untuk console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function prompt(question) {
    return new Promise((resolve) => {
        process.stdout.write(`${colors.cyan}${question}${colors.reset}`);
        process.stdin.once('data', (data) => {
            resolve(data.toString().trim());
        });
    });
}

async function updateSupabaseConfig() {
    log('\n🚀 Setup Aplikasi Koperasi untuk Production', 'bright');
    log('=' .repeat(50), 'blue');
    
    try {
        // Get Supabase credentials
        log('\n📝 Masukkan kredensial Supabase Anda:', 'yellow');
        const supabaseUrl = await prompt('Supabase URL (https://xxx.supabase.co): ');
        const supabaseAnonKey = await prompt('Supabase Anon Key: ');
        
        if (!supabaseUrl || !supabaseAnonKey) {
            log('❌ URL dan Anon Key harus diisi!', 'red');
            process.exit(1);
        }
        
        // Validate URL format
        if (!supabaseUrl.includes('supabase.co')) {
            log('❌ Format URL Supabase tidak valid!', 'red');
            process.exit(1);
        }
        
        // Update supabaseAuth.js
        const authFilePath = path.join(__dirname, 'js', 'supabaseAuth.js');
        
        if (!fs.existsSync(authFilePath)) {
            log('❌ File js/supabaseAuth.js tidak ditemukan!', 'red');
            process.exit(1);
        }
        
        let authContent = fs.readFileSync(authFilePath, 'utf8');
        
        // Replace URL and key
        authContent = authContent.replace(
            /const SUPABASE_URL = '[^']*';/,
            `const SUPABASE_URL = '${supabaseUrl}';`
        );
        
        authContent = authContent.replace(
            /const SUPABASE_ANON_KEY = '[^']*';/,
            `const SUPABASE_ANON_KEY = '${supabaseAnonKey}';`
        );
        
        // Write updated content
        fs.writeFileSync(authFilePath, authContent);
        
        log('✅ Konfigurasi Supabase berhasil diupdate!', 'green');
        
        // Create environment file for deployment
        const envContent = `# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Application Configuration
NODE_ENV=production
PORT=3000
`;
        
        fs.writeFileSync('.env.production', envContent);
        log('✅ File .env.production dibuat!', 'green');
        
        // Create deployment script
        const deployScript = `#!/bin/bash

# Deployment Script untuk Aplikasi Koperasi
echo "🚀 Starting deployment..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at the provided URL"
`;
        
        fs.writeFileSync('deploy.sh', deployScript);
        fs.chmodSync('deploy.sh', '755');
        log('✅ Script deployment dibuat!', 'green');
        
        // Show next steps
        log('\n🎉 Setup selesai! Langkah selanjutnya:', 'bright');
        log('1. Setup database di Supabase (lihat PANDUAN_HOSTING_DATABASE_REAL.md)', 'cyan');
        log('2. Jalankan: ./deploy.sh untuk deploy ke Vercel', 'cyan');
        log('3. Atau upload manual ke hosting pilihan Anda', 'cyan');
        log('\n📚 Baca PANDUAN_HOSTING_DATABASE_REAL.md untuk panduan lengkap', 'yellow');
        
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Check if running as main script
if (import.meta.url === `file://${process.argv[1]}`) {
    process.stdin.setRawMode(false);
    process.stdin.setEncoding('utf8');
    
    updateSupabaseConfig().then(() => {
        process.exit(0);
    }).catch((error) => {
        log(`❌ Fatal error: ${error.message}`, 'red');
        process.exit(1);
    });
}

// Browser compatibility - assign to window object
if (typeof window !== 'undefined') {
    window.updateSupabaseConfig = updateSupabaseConfig;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { updateSupabaseConfig };
}