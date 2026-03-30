# Contributing to RingOS Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

---

## 🌟 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Gracefully accept constructive criticism
- Focus on what is best for the community

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unethical or unprofessional conduct

---

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub, then:
git clone https://github.com/your-username/Service_Selling_Unique_Ring.git
cd Service_Selling_Unique_Ring
```

### 2. Setup Development Environment
```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend setup
cd ../frontend
npm install
```

### 3. Create a Branch
```bash
# Always branch from develop
git checkout develop
git checkout -b feature/your-feature-name
```

---

## 💻 Development Workflow

### Branch Naming Convention
```
feature/add-new-feature          # New features
bugfix/fix-login-issue           # Bug fixes
hotfix/critical-security-fix     # Urgent production fixes
docs/update-readme               # Documentation only
refactor/improve-performance     # Code refactoring
test/add-unit-tests              # Adding tests
```

### Making Changes
1. **Keep changes focused** - One feature/fix per branch
2. **Commit frequently** - Small, logical commits
3. **Write clear messages** - Follow commit guidelines
4. **Test locally** - Ensure everything works before pushing

### Example Workflow
```bash
# Start work
git checkout develop
git pull origin develop
git checkout -b feature/shopping-cart-improvement

# Make changes
git add .
git commit -m "feat(cart): Add persistent cart storage"

# Push and create PR
git push origin feature/shopping-cart-improvement
```

---

## 📝 Coding Standards

### JavaScript/Node.js (Backend)

#### Style Guide
- Use ESLint configuration (TODO: add)
- Follow Airbnb JavaScript Style Guide
- Use semicolons consistently
- Single quotes for strings
- 2-space indentation

#### File Structure
```javascript
// 1. Imports
import express from 'express';
import { authenticate } from '../middleware/auth';

// 2. Constants
const router = express.Router();
const ITEMS_PER_PAGE = 20;

// 3. Route handlers
router.get('/endpoint', authenticate, async (req, res) => {
  // Implementation
});

// 4. Helper functions
const helperFunction = () => {
  // Implementation
};

// 5. Export
export default router;
```

#### Error Handling
```javascript
// Always use try-catch for async operations
try {
  const result = await database.query(sql);
  return res.json(result);
} catch (error) {
  console.error('Error description:', error);
  return res.status(500).json({
    success: false,
    message: 'User-friendly error message'
  });
}
```

### TypeScript/React (Frontend)

#### Component Structure
```typescript
import React, { useState, useEffect } from 'react';

interface Props {
  userId: string;
  onLoad?: () => void;
}

const MyComponent: React.FC<Props> = ({ userId, onLoad }) => {
  // 1. Hooks
  const [state, setState] = useState<Type>(initialValue);
  
  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 3. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 4. Render
  return (
    <div className="component-class">
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

#### Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Files | camelCase or PascalCase | `authController.js`, `DashboardView.tsx` |
| Components | PascalCase | `UserProfile`, `ShoppingCart` |
| Functions/Variables | camelCase | `getUserData`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| CSS Classes | kebab-case | `user-profile`, `nav-item` |
| Directories | lowercase-hyphen | `user-management/`, `auth/` |

#### TypeScript Best Practices
- Define interfaces for all props and state
- Avoid `any` type - use proper typing
- Use union types for flexibility
- Export types/interfaces for reuse

---

## ✅ Commit Guidelines

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build/config changes

### Examples
```bash
# Feature
feat(cart): Add persistent cart storage with Redis

# Bug fix
fix(auth): Resolve JWT token expiration issue

# Documentation
docs(readme): Update installation instructions

# Refactor
refactor(users): Improve database query performance

# Multiple scopes
feat(api,routes): Add rate limiting to all endpoints
```

### Commit Best Practices
- Keep subject line under 72 characters
- Use imperative mood ("Add" not "Added")
- Don't end subject with period
- Reference issues/PRs when applicable

---

## 🔀 Pull Request Process

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No console errors
- [ ] No unnecessary files changed

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manually tested

## Checklist
- [ ] Code follows project guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tested locally
```

### Review Process
1. **Submit PR** with complete description
2. **Automated checks** run (CI/CD when available)
3. **Code review** by maintainers
4. **Address feedback** and update PR
5. **Approval** and merge to develop

### Merge Strategy
- Squash merge for feature branches
- Rebase merge for simple fixes
- Never merge directly to main

---

## 🧪 Testing Requirements

### Backend Testing (TODO: Implement)
```javascript
// Example test structure
describe('UserController', () => {
  describe('GET /api/users/:id', () => {
    it('should return user data', async () => {
      // Test implementation
    });
    
    it('should return 404 for non-existent user', async () => {
      // Test implementation
    });
  });
});
```

### Frontend Testing (TODO: Implement)
```typescript
// Example React test
describe('LoginView', () => {
  it('renders login form', () => {
    // Test implementation
  });
  
  it('submits valid credentials', async () => {
    // Test implementation
  });
});
```

### Test Coverage Goals
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Key user flows tested

---

## 📚 Documentation

### Code Comments
```javascript
/**
 * Authenticate user with JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {void}
 */
export const authenticate = (req, res, next) => {
  // Implementation
};
```

### README Updates
When adding new features:
1. Update main README.md
2. Add component-specific README if needed
3. Update API documentation
4. Add inline code comments

---

## 🐛 Reporting Bugs

### Bug Report Template
```markdown
**Describe the bug**
Clear description of what's wrong

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 2.0.0]

**Additional context**
Any other details
```

---

## 💡 Feature Requests

### Feature Request Template
```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Use Cases**
Who will use this and how?

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Mockups, examples, etc.
```

---

## 🔒 Security

### Security Best Practices
- Never commit sensitive data (API keys, passwords)
- Use environment variables for secrets
- Validate all user inputs
- Sanitize database queries
- Keep dependencies updated
- Report vulnerabilities responsibly

### Reporting Vulnerabilities
Email: [security@ringos.com] (TODO: setup)
Please include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

## 📞 Getting Help

- **Documentation**: Check README files
- **Existing Issues**: Search GitHub Issues
- **Discussions**: GitHub Discussions (TODO: setup)
- **Email**: [support@ringos.com] (TODO: setup)

---

## 🎯 Areas Needing Contribution

### High Priority
- [ ] Unit testing framework setup
- [ ] Integration testing suite
- [ ] E2E testing with Cypress/Playwright
- [ ] API documentation (Swagger/OpenAPI)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)

### Medium Priority
- [ ] Mobile app (React Native)
- [ ] Email notification service
- [ ] SMS integration
- [ ] Analytics dashboard
- [ ] Admin panel enhancements
- [ ] User onboarding flow

### Nice to Have
- [ ] Multi-language support
- [ ] Dark mode improvements
- [ ] Progressive Web App
- [ ] Social media integration
- [ ] Blog/content management
- [ ] Community forum

---

## 🏆 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Annual contributor highlights

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Questions?** Feel free to open an issue with the "question" label!

**Last Updated**: March 30, 2026
