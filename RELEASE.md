# Creating GitHub Releases for FoundryVTT Module

This repository is set up to automatically create GitHub releases when version tags are pushed. The releases will be available at: https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases

## Automated Release Process

### Using the Release Script (Recommended)

```bash
# Create version 1.1.0 
npm run release 1.1.0
```

This script will:
1. ✅ Update version numbers in `package.json`, `module.json`, and `package/module.json`
2. 🧪 Run all tests to ensure everything works
3. 🔨 Build the module with latest changes
4. 📦 Copy built files to the package directory
5. 💾 Commit all changes with a release message
6. 🏷️ Create and push a version tag (e.g., `v1.1.0`)
7. ⬆️ Push everything to GitHub
8. 🤖 Trigger GitHub Actions to create the release

### Manual Process

If you prefer to do it manually:

```bash
# 1. Update version numbers manually in:
#    - package.json
#    - module.json  
#    - package/module.json

# 2. Run tests and build
npm test
npm run build

# 3. Copy built files
cp dist/recall-knowledge.js package/scripts/

# 4. Commit and tag
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push
git push origin v1.1.0
```

## What Happens During Release

The GitHub Actions workflow (`.github/workflows/release.yml`) will:

1. **Build & Test** - Runs `npm ci`, `npm test`, and `npm run build`
2. **Package** - Creates a zip file with all module files (excluding tests)
3. **Release** - Creates a GitHub release with:
   - 📦 `recall-knowledge-v1.1.0.zip` - Complete module package  
   - 📄 `module.json` - Manifest file for FoundryVTT
   - 📖 Automatic release notes with installation instructions

## Installation URLs

After release, users can install the module using:

**Manifest URL:** `https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases/latest/download/module.json`

## Release Checklist

Before creating a release:

- [ ] All tests pass (`npm test`)  
- [ ] Module builds successfully (`npm run build`)
- [ ] Version number follows semantic versioning (x.y.z)
- [ ] CHANGELOG.md is updated with changes
- [ ] All changes are committed to main branch

## Troubleshooting

**Error: "Tests failed"**
- Run `npm test` locally to identify and fix failing tests

**Error: "Build failed"** 
- Run `npm run build` locally to identify and fix build issues
- Check for TypeScript errors with `npm run type-check`

**Error: "Tag already exists"**
- Use a new version number that hasn't been released yet
- Check existing releases: https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/releases

**Release not appearing**
- Check GitHub Actions status: https://github.com/tevwoods/foundry-vtt-recall-knowledge-ultimate/actions  
- Ensure the tag was pushed successfully: `git ls-remote --tags origin`