// Claude Code PreToolUse hook: blocks any edit to .env (or .env.local and the like; .env.example is allowed).
import { readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const tool = input.tool_input ?? {};
const isEnv = (name) => /^\.env(\..+)?$/.test(name) && name !== '.env.example';

function blocked() {
  // File tools: Write, Edit, MultiEdit, NotebookEdit.
  const file = tool.file_path ?? tool.notebook_path;
  if (file) return isEnv(path.basename(file));
  // Shell tools: a command that names a .env file and writes, moves or deletes something.
  const command = tool.command;
  if (typeof command !== 'string') return false;
  const namesEnv = command.split(/[\s'"`;|&<>()=]+/).some((word) => isEnv(path.basename(word.replaceAll('\\', '/'))));
  const writes =
    />|\btee\b|\bsed\b[^|;]*\s-i|\b(rm|mv|cp|truncate|touch|dd|ln)\b|\b(Set|Add|Clear)-Content\b|\bOut-File\b|\b(Remove|Move|Copy|Rename|New)-Item\b/i;
  return namesEnv && writes.test(command);
}

if (blocked()) {
  console.error('Blocked: .env holds secrets and must not be edited by the agent. Ask the user to change it.');
  process.exit(2);
}
