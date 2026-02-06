#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const packageDir = path.join(rootDir, 'package');

const ensureDir = (dir) => {
    fs.mkdirSync(dir, { recursive: true });
};

const cleanPackageDir = () => {
    if (fs.existsSync(packageDir)) {
        fs.rmSync(packageDir, { recursive: true, force: true });
    }
    ensureDir(packageDir);
};

const copyFile = (src, dest) => {
    if (!fs.existsSync(src)) {
        return;
    }
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
};

const copyDirectory = (src, dest) => {
    if (!fs.existsSync(src)) {
        return;
    }
    fs.cpSync(src, dest, { recursive: true });
};

const filesToCopy = [
    'module.json',
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'INSTALLATION.md',
    'DEVELOPMENT.md',
    'RELEASE.md'
];

const directoriesToCopy = [
    'lang',
    'macros',
    'packs',
    'styles',
    'assets'
];

const buildPackage = () => {
    console.log('🧹 Refreshing package directory...');
    cleanPackageDir();

    console.log('📄 Copying module metadata and documentation...');
    for (const file of filesToCopy) {
        const src = path.join(rootDir, file);
        if (fs.existsSync(src)) {
            const dest = path.join(packageDir, file);
            copyFile(src, dest);
        }
    }

    console.log('📁 Copying asset directories...');
    for (const dir of directoriesToCopy) {
        const src = path.join(rootDir, dir);
        if (fs.existsSync(src)) {
            const dest = path.join(packageDir, dir);
            copyDirectory(src, dest);
        }
    }

    console.log('🧠 Copying built scripts...');
    const packageScriptsDir = path.join(packageDir, 'scripts');
    const builtScript = path.join(rootDir, 'dist', 'recall-knowledge.js');

    if (!fs.existsSync(builtScript)) {
        throw new Error('Build output not found. Please run "npm run build" first.');
    }

    copyFile(builtScript, path.join(packageScriptsDir, 'recall-knowledge.js'));
    copyFile(path.join(rootDir, 'dist', 'recall-knowledge.js.map'), path.join(packageScriptsDir, 'recall-knowledge.js.map'));

    console.log('📦 Package directory ready at:', packageDir);
};

buildPackage();
