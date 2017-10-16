'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addModel = addModel;

var _utils = require('./utils');

var _path = require('path');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _Entry = require('../collections/Entry');

var _Entry2 = _interopRequireDefault(_Entry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Entry2.default.register();

function addModel(payload) {
  (0, _assert2.default)(payload.modelPath, 'api/entry/addModel: payload should have modelPath');
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  const source = (0, _utils.readFile)(filePath);
  const root = (0, _jscodeshift2.default)(source);
  root.addModel(payload.modelPath);
  (0, _utils.writeFile)(filePath, root.toSource());
}