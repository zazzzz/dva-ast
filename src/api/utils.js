import ejs from 'ejs';
import prettier from 'prettier';
import assert from 'assert';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { outputFileSync, removeSync } from 'fs-extra';

export function getTemplate(name) {
  const filePath = join(__dirname, `../../boilerplates/${name}.ejs`);
  assert(existsSync(filePath), `getTemplate: file ${name} not fould`);
  const source = readFileSync(filePath, 'utf-8');
  return source;
}

export function renderTemplate(name, option) {
  const template = getTemplate(name);
  const source = ejs.render(template, option);
  return source;
}

export function readFile(filePath) {
  return readFileSync(filePath, 'utf-8');
}

export function writeFile(filePath, source) {
  source = prettier.format(source, {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'none',
    bracketSpacing: true,
    jsxBracketSameLine: false,
    parser: 'babylon',
    requirePragma: false
  });

  outputFileSync(filePath, source, 'utf-8');
}

export function writeCSSFile(filePath, source) {
  outputFileSync(filePath, source, 'utf-8');
}

export function removeFile(filePath) {
  removeSync(filePath);
}
