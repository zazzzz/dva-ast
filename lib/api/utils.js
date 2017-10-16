'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTemplate = getTemplate;
exports.renderTemplate = renderTemplate;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.writeCSSFile = writeCSSFile;
exports.removeFile = removeFile;

var _ejs = require('ejs');

var _ejs2 = _interopRequireDefault(_ejs);

var _prettier = require('prettier');

var _prettier2 = _interopRequireDefault(_prettier);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _path = require('path');

var _fs = require('fs');

var _fsExtra = require('fs-extra');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getTemplate(name) {
  const filePath = (0, _path.join)(__dirname, `../../boilerplates/${name}.ejs`);
  (0, _assert2.default)((0, _fs.existsSync)(filePath), `getTemplate: file ${name} not fould`);
  const source = (0, _fs.readFileSync)(filePath, 'utf-8');
  return source;
}

function renderTemplate(name, option) {
  const template = getTemplate(name);
  const source = _ejs2.default.render(template, option);
  return source;
}

function readFile(filePath) {
  return (0, _fs.readFileSync)(filePath, 'utf-8');
}

function writeFile(filePath, source) {
  source = _prettier2.default.format(source, {
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

  (0, _fsExtra.outputFileSync)(filePath, source, 'utf-8');
}

function writeCSSFile(filePath, source) {
  (0, _fsExtra.outputFileSync)(filePath, source, 'utf-8');
}

function removeFile(filePath) {
  (0, _fsExtra.removeSync)(filePath);
}