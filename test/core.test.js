import test from 'node:test';
import assert from 'node:assert/strict';
import { Command, matchCommand } from '../cli/ui/keyBindings.js';
import { countMessagesTokens } from '../cli/ai/tokens.js';
import { summarizeOldMessages } from '../cli/ai/summary.js';
import { tools } from '../cli/tools/tools.js';

test('Escape is the only agent-cancellation binding', () => {
  assert.equal(matchCommand({ name: 'escape', sequence: '', ctrl: false, shift: false, meta: false }, Command.CANCEL), true);
  assert.equal(matchCommand({ name: 'c', sequence: 'c', ctrl: true, shift: false, meta: false }, Command.CANCEL), false);
});

test('tool-call arguments are included in the context budget', () => {
  const withoutTool = countMessagesTokens([{ role: 'assistant', content: 'same' }]);
  const withTool = countMessagesTokens([{ role: 'assistant', content: 'same', tool_calls: [{ function: { name: 'raw_command', arguments: '{"command":"x"}'.repeat(30) } }] }]);
  assert.ok(withTool > withoutTool);
});

test('compaction keeps a recent conversation at a user-turn boundary', () => {
  const messages = [{ role: 'system', content: 'system' }];
  for (let index = 0; index < 12; index++) {
    messages.push({ role: 'user', content: `request ${index} ${'x'.repeat(900)}` });
    messages.push({ role: 'assistant', content: `answer ${index}` });
  }
  messages.push({ role: 'assistant', content: null, tool_calls: [{ id: 'call-last', function: { name: 'nmap_scan', arguments: '{}' } }] });
  messages.push({ role: 'tool', tool_call_id: 'call-last', name: 'nmap_scan', content: 'result' });
  const compacted = summarizeOldMessages(messages, 'unknown');
  const firstRecent = compacted.slice(3).at(0);
  assert.equal(firstRecent.role, 'user');
  assert.ok(compacted.some(message => message.tool_call_id === 'call-last'));
});

test('the agent can invoke saved workflows through run_skill', () => {
  const runSkill = tools.find(tool => tool.function.name === 'run_skill');
  assert.deepEqual(runSkill.function.parameters.required, ['name']);
});
