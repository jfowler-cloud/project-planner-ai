# Contributing to Project Planner AI

Thank you for your interest in contributing! This project is currently in active development.

## Development Setup

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup instructions.

## How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Run tests** (`uv run pytest` for backend, `npm test` for frontend)
5. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## Code Style

### Python
- Follow PEP 8
- Use Ruff for linting and formatting
- Type hints required (mypy strict mode)
- Docstrings for all public functions

### TypeScript/React
- Follow ESLint rules
- Use Prettier for formatting
- TypeScript strict mode
- Functional components with hooks

## Testing

- Maintain 95%+ test coverage
- Write tests for all new features
- Update tests when modifying existing code
- Run full test suite before submitting PR

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update README.md if needed
5. Request review from maintainers

## Questions?

Open an issue or reach out to [@jfowler-cloud](https://github.com/jfowler-cloud)
