import {
  renderTemplate,
  writeFile,
  writeCSSFile
} from './utils';
import assert from 'assert';
import j from 'jscodeshift';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { addModel } from './entry';
import Model from '../collections/Model';

Model.register();

function create (type, payload) {
  assert(payload.componentName, `api/zatlas/${type}: payload should have componentName`);
  const source = renderTemplate(`zatlas.${type}`, payload);
  const filePath = join(payload.sourcePath, payload.filePath);
  assert(!existsSync(filePath), `api/zatlas/${type}: file exists`);
  writeFile(filePath, source);

  if (payload.cssPath) {
    const cssFilePath = join(payload.sourcePath, payload.cssPath);
    const cssSource = renderTemplate(`zatlas.${type}CSS`, {});
    writeCSSFile(cssFilePath, cssSource);
  }
}

export function createComponent (payload) {
  create('createComponent', payload);
}

export function createContainer (payload) {
  create('createContainer', payload);
}

export function createModel (payload) {
  assert(payload.namespace, 'api/zatlas/createModel: payload should have namespace');
  const source = renderTemplate('zatlas.createModel', payload);
  const filePath = join(payload.sourcePath, payload.filePath);
  assert(!existsSync(filePath), 'api/zatlas/createModel: file exists');
  writeFile(filePath, source);

  // Add model to entry
  if (payload.entry && payload.modelPath) {
    addModel({
      sourcePath: payload.sourcePath,
      filePath: payload.entry,
      modelPath: payload.modelPath,
    });
  }
}

export function createService (payload) {
  assert(payload.name, 'api/zatlas/createService: payload should have name');
  const source = renderTemplate('zatlas.createService', payload);
  const filePath = join(payload.sourcePath, payload.filePath);
  assert(!existsSync(filePath), 'api/zatlas/createService: file exists');
  writeFile(filePath, source);
}