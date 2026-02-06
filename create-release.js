#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

// Get version from command line argument
const version = process.argv[2];

if (!version) {
    console.error('❌ Please provide a version number');
    console.error('Usage: node create-release.js <version>');
    console.error('Example: node create-release.js 1.1.0');
    process.exit(1);
}

// Validate version format (x.y.z)
if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('❌ Version must be in format x.y.z (e.g., 1.0.0)');
    process.exit(1);
}

const tagName = `v${version}`;

try {
    console.log(`🚀 Creating release ${tagName}...`);

    // Check if this is a git repository
    try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch (error) {
        console.error('❌ This directory is not a git repository.');
        console.error('');
        console.error('To set up git repository and GitHub integration:');
        console.error('1. Initialize git: git init');
        console.error('2. Add remote: git remote add origin https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate.git');
        console.error('3. Add files: git add .');
        console.error('4. Initial commit: git commit -m "Initial commit"');
        console.error('5. Push to GitHub: git push -u origin main');
        console.error('');
        console.error('Then run the release script again.');
        process.exit(1);
    }

    // Check if we have uncommitted changes
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim() && !status.includes('package.json') && !status.includes('module.json')) {
            console.error('❌ You have uncommitted changes. Please commit or stash them first.');
            console.error('');
            console.error('Uncommitted files:');
            console.error(status);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error checking git status:', error.message);
        process.exit(1);
    }

    // Update version in package.json
    console.log('📝 Updating package.json...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = version;
    packageJson.manifest = `https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/download/${tagName}/module.json`;
    packageJson.download = `https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/download/${tagName}/recall-knowledge-${tagName}.zip`;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 4));

    // Update version in module.json
    console.log('📝 Updating module.json...');
    const moduleJson = JSON.parse(fs.readFileSync('module.json', 'utf8'));
    moduleJson.version = version;
    moduleJson.manifest = `https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/download/${tagName}/module.json`;
    moduleJson.download = `https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/download/${tagName}/recall-knowledge-${tagName}.zip`;
    fs.writeFileSync('module.json', JSON.stringify(moduleJson, null, 4));

    // Update version in package/module.json
    console.log('📝 Updating package/module.json...');
    const packageModuleJson = JSON.parse(fs.readFileSync('package/module.json', 'utf8'));
    packageModuleJson.version = version;
    packageModuleJson.manifest = `https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/download/${tagName}/module.json`;
    packageModuleJson.download = `https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/download/${tagName}/recall-knowledge-${tagName}.zip`;
    fs.writeFileSync('package/module.json', JSON.stringify(packageModuleJson, null, 4));

    // Run tests
    console.log('🧪 Running tests...');
    execSync('npm test', { stdio: 'inherit' });

    // Build the module
    console.log('🔨 Building module...');
    execSync('npm run build', { stdio: 'inherit' });

    // Copy built files to package
    console.log('📦 Copying built files to package...');
    execSync('copy dist\\recall-knowledge.js package\\scripts\\', { stdio: 'inherit' });

    // Check if this is a git repository and handle accordingly
    let isGitRepo = false;
    try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
        isGitRepo = true;
    } catch (error) {
        // Not a git repository, skip git operations
        isGitRepo = false;
    }

    if (isGitRepo) {
        // Git operations
        console.log('💾 Committing version changes...');
        execSync(`git add package.json module.json package/module.json package/scripts/recall-knowledge.js`, { stdio: 'inherit' });
        execSync(`git commit -m "Release ${tagName}"`, { stdio: 'inherit' });

        // Create and push tag
        console.log(`🏷️  Creating tag ${tagName}...`);
        execSync(`git tag ${tagName}`, { stdio: 'inherit' });

        console.log('⬆️  Pushing to GitHub...');
        execSync('git push', { stdio: 'inherit' });
        execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

        console.log('✅ Release process complete!');
        console.log(`📖 Check GitHub Actions: https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/actions`);
        console.log(`🎉 Release will be available at: https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/tag/${tagName}`);
    } else {
        console.log('');
        console.log('⚠️  No git repository detected. Files have been prepared but not committed.');
        console.log('');
        console.log('🔧 To complete the release, first set up git:');
        console.log('   git init');
        console.log('   git remote add origin https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate.git');
        console.log('   git add .');
        console.log('   git commit -m "Initial commit"');
        console.log('   git push -u origin main');
        console.log('');
        console.log('🔧 Then create the release:');
        console.log(`   git add package.json module.json package/module.json package/scripts/recall-knowledge.js`);
        console.log(`   git commit -m "Release ${tagName}"`);
        console.log(`   git tag ${tagName}`);
        console.log(`   git push`);
        console.log(`   git push origin ${tagName}`);
    }

} catch (error) {
    console.error('❌ Error creating release:', error.message);
    process.exit(1);
}