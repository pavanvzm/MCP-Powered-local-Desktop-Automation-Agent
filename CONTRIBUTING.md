# Contributing to AI Agent Production System

We love contributions! Here's how to get started.

## Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes with semantic commit messages
4. **Push** to your fork
5. **Submit** a Pull Request

## Commit Convention

We use semantic commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance
- `style:` Formatting

## Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Code Standards

- **Python**: PEP 8, type hints, 90%+ test coverage
- **TypeScript**: Strict mode, clean code principles
- **Docker**: Multi-stage builds, health checks
- **Security**: No secrets in code, input validation

## Testing

```bash
# Backend
cd backend && pytest --cov=app

# Frontend
cd frontend && npm test -- --run
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Add tests for new features
4. Request review from maintainers

Thank you for contributing! 🚀
