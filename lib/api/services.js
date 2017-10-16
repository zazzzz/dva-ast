'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;

var _utils = require('./utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _path = require('path');

var _fs = require('fs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function create(payload) {
  (0, _assert2.default)(payload.namespace, 'api/services/create: payload should have name');
  const source = (0, _utils.renderTemplate)('services.create', payload);
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _assert2.default)(!(0, _fs.existsSync)(filePath), 'api/services/create: file exists');
  (0, _utils.writeFile)(filePath, source);
}