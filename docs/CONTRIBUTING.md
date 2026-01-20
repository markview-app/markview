# Contributing to MarkView

Thank you for your interest in contributing to the MarkView open-source edition! This document provides guidelines for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Contribution Guidelines](#contribution-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Style Guides](#style-guides)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:

- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race or ethnicity
- Age
- Religion
- Nationality

### Our Standards

**Positive behavior includes**:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior includes**:

- Harassment, trolling, or insulting comments
- Public or private harassment
- Publishing others' private information without permission
- Other conduct inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team. All complaints will be reviewed and investigated promptly and fairly.

---

## How Can I Contribute?

### ✅ Contributions We Welcome

1. **Bug Fixes**
   - Fix rendering issues
   - Resolve performance problems
   - Correct markdown parsing errors
   - Fix browser compatibility issues

2. **Performance Improvements**
   - Optimize rendering speed
   - Reduce bundle size
   - Improve memory usage
   - Enhance load times

3. **Documentation**
   - Fix typos or unclear explanations
   - Add examples and tutorials
   - Improve code comments
   - Translate documentation

4. **Accessibility**
   - Improve keyboard navigation
   - Enhance screen reader support
   - Add ARIA labels
   - Improve color contrast

5. **Core Features**
   - New markdown-it plugins (if universally useful)
   - Enhanced markdown rendering
   - Better error handling
   - Security improvements

6. **Testing**
   - Add unit tests
   - Improve test coverage
   - Create integration tests
   - Add edge case tests

### ❌ Contributions We Don't Accept

1. **Features Requiring External Services**
   - Cloud sync
   - Analytics integration
   - Third-party API calls
   - Server-side processing

2. **Breaking Changes**
   - Changes that break existing functionality
   - Incompatible API changes
   - Removal of core features

3. **Large Dependency Additions**
   - Heavy libraries (>100KB)
   - Frameworks (React, Vue, etc.)
   - Unnecessary dependencies

---

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git 2.0+

### Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR-USERNAME/markview.git
cd markview

# Install dependencies
pnpm install

# Start development
pnpm run dev

# Run tests
pnpm run test

# Run linter
pnpm run lint
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.

---

## Contribution Guidelines

### Before You Start

1. **Check existing issues** - Someone might already be working on it
2. **Open an issue first** - Discuss your idea before coding
3. **Keep it focused** - One feature/fix per pull request
4. **Follow the style guide** - Use existing code patterns

### Feature Proposals

**For new features**, open an issue with:

- **Title**: Clear, descriptive name
- **Problem**: What problem does this solve?
- **Solution**: How will this feature work?
- **Alternatives**: Other approaches you considered
- **Additional context**: Mockups, examples, use cases

**Example**:

```markdown
## Problem
Code blocks with long lines require horizontal scrolling, which is hard on mobile.

## Proposed Solution
Add word-wrap option for code blocks with a toggle button.

## Alternatives Considered
- Automatic word-wrap (breaks formatting for some languages)
- Virtual scrolling (too complex for this use case)

## Additional Context
- Screenshot of current behavior
- Example of desired behavior
```

### Bug Reports

**For bugs**, open an issue with:

- **Title**: Short description (e.g., "TOC not rendering for H2 headings")
- **Steps to reproduce**: Numbered list of exact steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, OS, extension version
- **Additional context**: Screenshots, error messages

**Use the bug report template** when available.

---

## Pull Request Process

### 1. Preparation

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Development

- Write code following the [style guide](#style-guides)
- Add tests for new functionality
- Update documentation if needed
- Keep commits atomic and focused

### 3. Testing

```bash
# Run all tests
pnpm run test:run

# Check test coverage
pnpm run test:coverage

# Type check
pnpm run type-check

# Lint code
pnpm run lint:fix

# Format code
pnpm run format
```

### 4. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>: <description>
git commit -m "feat: add support for custom containers"
git commit -m "fix: resolve TOC scrolling issue on mobile"
git commit -m "docs: update README with new features"
```

**Commit types**:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `perf:` - Performance
- `test:` - Tests
- `chore:` - Build/tooling

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:

**Title**: Clear, descriptive (e.g., "Add support for GitHub-style alerts")

**Description**:

```markdown
## What does this PR do?
Brief description of changes

## Why is this needed?
Problem this solves

## How to test
1. Step-by-step testing instructions
2. Expected results

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Follows style guide
- [ ] All tests passing
```

### 6. Review Process

- **Automated checks** must pass (lint, tests, build)
- **Code review** by maintainers
- **Address feedback** promptly
- **Squash commits** if requested
- **Update branch** if conflicts arise

### 7. Merging

Once approved:

- Maintainers will merge your PR
- Your changes will be included in the next release
- You'll be credited in the changelog

---

## Issue Guidelines

### Creating Issues

**Good issue**:

- Clear, descriptive title
- Detailed description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details
- Screenshots/code samples

**Bad issue**:

- Vague title ("It doesn't work")
- No details ("Fix the bug")
- Missing context
- Duplicate of existing issue

### Issue Labels

We use labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Community input needed
- `duplicate` - Already reported
- `wontfix` - Won't be addressed

### Issue Lifecycle

1. **Open** - Issue created
2. **Triage** - Reviewed by maintainers, labeled
3. **Assigned** - Someone working on it
4. **In Progress** - PR submitted
5. **Closed** - Fixed or resolved

---

## Style Guides

### TypeScript Style

```typescript
// ✅ Good
interface RenderOptions {
  theme: 'light' | 'dark';
  plugins: string[];
}

function render(options: RenderOptions): string {
  const { theme, plugins } = options;
  // Implementation
}

// ❌ Avoid
function render(options: any) {
  // Implementation
}
```

**Guidelines**:

- Use TypeScript for all new code
- Prefer `const` over `let`
- Avoid `any` type
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### File Structure

```typescript
// 1. Imports
import { dependency } from 'package';
import { LocalModule } from './local';

// 2. Types/Interfaces
interface MyInterface {
  prop: string;
}

// 3. Constants
const CONSTANT_VALUE = 100;

// 4. Implementation
export class MyClass {
  // ...
}

// 5. Exports
export { helper } from './helper';
```

### CSS Style

```css
/* Use BEM naming convention */
.markview { }
.markview__header { }
.markview__header--active { }

/* Group related properties */
.element {
  /* Positioning */
  position: relative;
  top: 0;

  /* Display & Box Model */
  display: flex;
  width: 100%;
  padding: 1rem;

  /* Typography */
  font-size: 1rem;
  color: #333;

  /* Visual */
  background: white;
  border: 1px solid #ddd;

  /* Misc */
  cursor: pointer;
}
```

### Git Commit Messages

```bash
# Good commits
feat: add support for GitHub alerts
fix: resolve TOC rendering issue on Safari
docs: update installation instructions
test: add tests for markdown parser

# Bad commits
update code
fix bug
changes
WIP
```

**Rules**:

- Use imperative mood ("add" not "added")
- First line max 72 characters
- Explain "why" in commit body if needed
- Reference issue numbers (#123)

---

## Community

### Where to Get Help

- **Documentation**: Start with [DEVELOPMENT.md](DEVELOPMENT.md)
- **GitHub Discussions**: [Ask questions](https://github.com/markview-app/support/discussions)
- **GitHub Issues**: [Report bugs](https://github.com/markview-app/markview/issues)

### Recognition

Contributors are recognized in:

- `CHANGELOG.md` for each release
- GitHub contributor graph
- Special mentions for significant contributions

### Becoming a Maintainer

Consistent, high-quality contributors may be invited to become maintainers with:

- Commit access
- Issue/PR triage permissions
- Voice in project direction

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Don't hesitate to ask! We're here to help:

- Open a [GitHub Discussion](https://github.com/markview-app/support/discussions)
- Comment on the relevant issue
- Reach out to maintainers

---

**Thank you for contributing! 🎉**

Every contribution, no matter how small, helps make MarkView better for everyone.

---

**Last Updated**: January 2026
