// The stage table matches the backend's (DATA-7), and the series order follows the brand (LOOK-4).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERIES, STAGES, barColor, stage } from './stages';

function backendStages() {
  const source = readFileSync(join(__dirname, '../../../backend/accountable/deals/stages.py'), 'utf8');
  const constants: Record<string, string> = {};
  for (const m of source.matchAll(/^(\w+) = "(#[0-9A-F]{6})"/gm)) constants[m[1]!] = m[2]!;
  const color = (token: string) => (token.startsWith('"') ? token.slice(1, -1) : constants[token]);
  return [...source.matchAll(/Stage\("(\w+)", "(\w+)", (\d+), (True|False), ([^,]+), ([^)]+)\)/g)].map((m) => ({
    key: m[1],
    label: m[2],
    probability: Number(m[3]),
    open: m[4] === 'True',
    color: color(m[5]!.trim()),
    textColor: color(m[6]!.trim()),
  }));
}

describe('stages (DATA-7)', () => {
  it('match the backend stage table: labels, probabilities, open, colors', () => {
    const backend = backendStages();
    expect(backend).toHaveLength(6);
    expect(STAGES).toEqual(backend);
  });

  it('look up by key', () => {
    expect(stage('negotiation').label).toBe('Negotiation');
    expect(() => stage('pending')).toThrow();
  });

  it('give Lost a probability bar that shows on a pale track', () => {
    expect(barColor('lost')).not.toBe(stage('lost').color);
    expect(barColor('new')).toBe('#06D6A0');
  });
});

describe('series order (LOOK-4)', () => {
  it('is Sea Green, Marigold, Coral, Cerulean, then Raspberry', () => {
    expect(SERIES).toEqual(['#06D6A0', '#FFC145', '#F78C6B', '#118AB2', '#EF476F']);
  });
  it('is the order of the open stages', () => {
    expect(STAGES.slice(0, 4).map((s) => s.color)).toEqual(SERIES.slice(0, 4));
  });
});
