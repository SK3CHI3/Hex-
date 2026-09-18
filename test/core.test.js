import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { PassThrough } from 'node:stream';
import { render } from 'ink';
import { Command, matchCommand } from '../cli/ui/keyBindings.js';
import { countMessagesTokens } from '../cli/ai/tokens.js';
import { summarizeOldMessages } from '../cli/ai/summary.js';
import { tools } from '../cli/tools/tools.js';
import { isMouseSequence, parseMouseClick } from '../cli/ui/mouse.js';
import App from '../cli/ui/App.js';

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

test('SGR primary-button reports become pointer clicks without entering the draft', () => {
  assert.deepEqual(parseMouseClick('[<0;42;9M'), { x: 42, y: 9 });
  assert.equal(parseMouseClick('[<0;42;9m'), null);
  assert.equal(parseMouseClick('[<64;42;9M'), null);
  assert.equal(isMouseSequence('[<0;42;9M'), true);
});

test('the transcript renders only the active tool instead of every queued call', async () => {
  const stdout = new PassThrough();
  Object.assign(stdout, { isTTY: true, rows: 24, columns: 100 });
  let output = '';
  stdout.on('data', chunk => { output += chunk; });
  const stdin = new PassThrough();
  Object.assign(stdin, { isTTY: true, setRawMode: () => {}, ref: () => {}, unref: () => {} });
  const app = render(React.createElement(App, {
    model: 'test', streaming: true,
    agentStatus: { phase: 'running', toolName: 'first', toolCallId: 'one', toolIndex: 1, toolTotal: 2 },
    messages: [{ role: 'assistant', content: null, tool_calls: [
      { id: 'one', function: { name: 'first', arguments: '{"a":1}' } },
      { id: 'two', function: { name: 'second', arguments: '{"b":2}' } },
    ] }],
  }), { stdout, stdin, exitOnCtrlC: false });
  await new Promise(resolve => setTimeout(resolve, 20));
  app.unmount();
  assert.match(output, /Running tool 1\/2: first/);
  assert.doesNotMatch(output, /Queued tool 2\/2: second/);
});
