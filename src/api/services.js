import {
  renderTemplate,
  writeFile
} from './utils';
import assert from 'assert';
import { extname, join } from 'path';
import { existsSync } from 'fs';

export function create(payload) {
  assert(payload.namespace, 'api/services/create: payload should have name');
  const source = renderTemplate('services.create', payload);
  const filePath = join(payload.sourcePath, payload.filePath);
  assert(!existsSync(filePath), 'api/services/create: file exists');
  writeFile(filePath, source);
}
