import express from 'express';
import pino from 'pino';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 8081;
const LATENCY_MS = Number(process.env.LATENCY_MS ?? 50);
const FAIL_RATE = Number(process.env.FAIL_RATE ?? 0); // 0..1
const LOG_DIR = path.resolve('logs');
fs.mkdirSync(LOG_DIR, { recursive: true });
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
app.use(express.json({ limit: '1mb' }));

// In-memory capture for quick assertions from tests
const requests = [];

// Minimal Jira issue-create schema
const IssueCreate = z.object({
  fields: z.object({
    project: z.object({ key: z.string().min(1) }),
    summary: z.string().min(1),
    description: z.string().optional(),
    issuetype: z.object({ name: z.string().default('Bug') }).optional()
  })
});

const jitter = () => new Promise(r => setTimeout(r, LATENCY_MS));

app.post('/rest/api/3/issue', async (req, res) => {
  await jitter();
  const request_id = req.header('x-request-id') || null;
  const now = Date.now();

  // Record to memory + ndjson file
  const record = { ts: now, path: req.path, request_id, body: req.body };
  requests.push(record);
  fs.appendFileSync(path.join(LOG_DIR, 'requests.ndjson'), JSON.stringify(record) + '\n');

  if (Math.random() < FAIL_RATE) {
    log.warn({ request_id }, 'jira_mock: injected failure');
    return res.status(500).json({ errorMessages: ['Injected failure'], errors: {} });
  }

  const parsed = IssueCreate.safeParse(req.body);
  if (!parsed.success) {
    log.warn({ request_id, err: parsed.error.flatten() }, 'jira_mock: validation failed');
    return res.status(400).json({ errorMessages: ['Invalid payload'], errors: parsed.error.flatten() });
  }

  const key = `QA-${100 + requests.length}`;
  const id = String(10_000 + requests.length);
  log.info({ request_id, key }, 'jira_mock: created issue');
  return res.status(201).json({ id, key, self: `http://jira-mock:${PORT}/browse/${key}` });
});

// Test admin helpers
app.get('/_admin/requests', (_req, res) => res.json({ count: requests.length, items: requests.slice(-50) }));
app.post('/_admin/reset', (_req, res) => { requests.length = 0; fs.writeFileSync(path.join(LOG_DIR, 'requests.ndjson'), ''); res.status(204).end(); });

app.listen(PORT, () => log.info({ port: PORT, fail_rate: FAIL_RATE, latency_ms: LATENCY_MS }, 'jira_mock: up'));
