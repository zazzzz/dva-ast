import {
  renderTemplate,
  writeFile,
  writeCSSFile,
} from './utils';
import assert from 'assert';
import { extname, join } from 'path';
import { existsSync } from 'fs';

export function create(payload) {
  assert(payload.componentName, 'api/components/create: payload should have componentName');
  const source = renderTemplate('components.create', payload);
  const filePath = join(payload.sourcePath, payload.filePath);
  assert(!existsSync(filePath), 'api/components/create: file exists');
  writeFile(filePath, source);

  if (payload.css) {
    let cssFilePath = filePath;
    const en = extname(filePath);
    if (en) {
      cssFilePath = filePath.slice(0, filePath.lastIndexOf(en));
    }
    cssFilePath = cssFilePath + '.css';
    writeCSSFile(cssFilePath, `\r\n.root {\r\n\r\n}\r\n`);
  }
}
