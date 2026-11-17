// The listed libraries are the ones in use (APP-10).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const frontend = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
const root = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf8'));
const pyproject = readFileSync(join(__dirname, '../../../pyproject.toml'), 'utf8');
const deps = { ...frontend.dependencies, ...frontend.devDependencies };

describe('libraries (APP-10)', () => {
  it.each([
    ['routing', 'react-router'],
    ['server data and caching', '@tanstack/react-query'],
    ['tables', '@tanstack/react-table'],
    ['charts', 'recharts'],
    ['drag and drop', '@dnd-kit/core'],
    ['drag and drop sorting', '@dnd-kit/sortable'],
    ['forms', 'react-hook-form'],
    ['validation', 'zod'],
    ['dialogs', '@radix-ui/react-dialog'],
    ['menus', '@radix-ui/react-dropdown-menu'],
    ['selects', '@radix-ui/react-select'],
    ['icons', 'lucide-react'],
    ['dates', 'date-fns'],
    ['font: Instrument Sans', '@fontsource/instrument-sans'],
    ['font: Instrument Serif', '@fontsource/instrument-serif'],
    ['font: JetBrains Mono', '@fontsource/jetbrains-mono'],
    ['API types', 'openapi-typescript'],
    ['unit tests', 'vitest'],
  ])('%s uses %s', (_need, name) => {
    expect(deps).toHaveProperty(name);
  });

  it('runs both servers with concurrently, and end-to-end tests with Playwright', () => {
    expect(root.devDependencies).toHaveProperty('concurrently');
    expect(root.devDependencies).toHaveProperty('@playwright/test');
  });

  it.each(['fastapi', 'pydantic', 'sqlalchemy', 'uvicorn', 'alembic', 'pytest'])('the backend uses %s', (name) => {
    expect(pyproject).toContain(`"${name}`);
  });
});
