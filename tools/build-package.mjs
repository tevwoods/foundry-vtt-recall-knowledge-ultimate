#!/usr/bin/env node

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const outputIdx = args.findIndex(arg => arg === '--output');
const outputDir = outputIdx !== -1 && args[outputIdx + 1]
    ? path.resolve(args[outputIdx + 1])
    : path.join(repoRoot, 'package');

const skipBuild = args.includes('--skip-build');

function logStep(message) {
    console.log(`➡️  ${message}`);
}

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function copyFileRelative(srcRelative, destRelative) {
    const srcPath = path.resolve(repoRoot, srcRelative);
    const destPath = path.resolve(outputDir, destRelative);
    await ensureDir(path.dirname(destPath));
    await fs.copyFile(srcPath, destPath);
}

async function copyDirectoryRelative(srcRelative, destRelative) {
    const srcPath = path.resolve(repoRoot, srcRelative);
    const destPath = path.resolve(outputDir, destRelative);
    await ensureDir(destPath);
    await fs.rm(destPath, { recursive: true, force: true });
    await fs.cp(srcPath, destPath, { recursive: true });
}

async function copyTemplate(templateRelative, destRelative) {
    const templatePath = path.resolve(__dirname, 'package-template', templateRelative);
    const destPath = path.resolve(outputDir, destRelative);
    await ensureDir(path.dirname(destPath));
    await fs.copyFile(templatePath, destPath);
}

async function createPackageStructure() {
    logStep(`Preparing output directory at ${outputDir}`);
    await fs.rm(outputDir, { recursive: true, force: true });
    await ensureDir(outputDir);

    const rootFiles = [
        ['CHANGELOG.md', 'CHANGELOG.md'],
        ['README.md', 'README.md'],
        ['LICENSE', 'LICENSE'],
        ['module.json', 'module.json'],
        ['package.json', 'package.json'],
        ['jest.config.js', 'jest.config.js']
    ];

    for (const [src, dest] of rootFiles) {
        logStep(`Copying ${src} → ${dest}`);
        await copyFileRelative(src, dest);
    }

    const directories = [
        ['lang', 'lang'],
        ['macros', 'macros'],
        ['styles', 'styles'],
        ['tests', 'tests']
    ];

    for (const [src, dest] of directories) {
        logStep(`Copying directory ${src} → ${dest}`);
        await copyDirectoryRelative(src, dest);
    }

    logStep('Adding installation guide');
    await copyTemplate('INSTALLATION.md', 'INSTALLATION.md');

    const distScript = path.resolve(repoRoot, 'dist', 'recall-knowledge.js');
    try {
        await fs.access(distScript);
    } catch (error) {
        throw new Error('Missing dist/recall-knowledge.js. Run npm run build first or omit --skip-build.');
    }

    logStep('Copying compiled script to package/scripts/recall-knowledge.js');
    await copyFileRelative(path.join('dist', 'recall-knowledge.js'), path.join('scripts', 'recall-knowledge.js'));

    const distMap = path.resolve(repoRoot, 'dist', 'recall-knowledge.js.map');
    try {
        await fs.access(distMap);
        logStep('Copying source map to package/scripts/recall-knowledge.js.map');
        await copyFileRelative(path.join('dist', 'recall-knowledge.js.map'), path.join('scripts', 'recall-knowledge.js.map'));
    } catch {
        // Source map optional
    }
}

async function main() {
    if (!skipBuild) {
        logStep('Building project (npm run build)');
        execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' });
    } else {
        logStep('Skipping build step as requested');
    }

    await createPackageStructure();

    logStep('Package folder regenerated successfully');
}

main().catch(error => {
    console.error('❌ Failed to rebuild package directory');
    console.error(error.message);
    process.exitCode = 1;
});
