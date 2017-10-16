'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createComponent = createComponent;
exports.createContainer = createContainer;
exports.createModel = createModel;
exports.createService = createService;

var _utils = require('./utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _path = require('path');

var _fs = require('fs');

var _entry = require('./entry');

var _Model = require('../collections/Model');

var _Model2 = _interopRequireDefault(_Model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Model2.default.register();

function create(type, payload) {
  (0, _assert2.default)(payload.componentName, `api/zatlas/${type}: payload should have componentName`);
  const source = (0, _utils.renderTemplate)(`zatlas.${type}`, payload);
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _assert2.default)(!(0, _fs.existsSync)(filePath), `api/zatlas/${type}: file exists`);
  (0, _utils.writeFile)(filePath, source);

  if (payload.cssPath) {
    const cssFilePath = (0, _path.join)(payload.sourcePath, payload.cssPath);
    const cssSource = (0, _utils.renderTemplate)(`zatlas.${type}CSS`, {});
    (0, _utils.writeCSSFile)(cssFilePath, cssSource);
  }
}

function createComponent(payload) {
  create('createComponent', payload);
}

function createContainer(payload) {
  create('createContainer', payload);
}

function createModel(payload) {
  (0, _assert2.default)(payload.namespace, 'api/zatlas/createModel: payload should have namespace');
  const source = (0, _utils.renderTemplate)('zatlas.createModel', payload);
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _assert2.default)(!(0, _fs.existsSync)(filePath), 'api/zatlas/createModel: file exists');
  (0, _utils.writeFile)(filePath, source);

  // Add model to entry
  if (payload.entry && payload.modelPath) {
    (0, _entry.addModel)({
      sourcePath: payload.sourcePath,
      filePath: payload.entry,
      modelPath: payload.modelPath
    });
  }
}

function createService(payload) {
  (0, _assert2.default)(payload.name, 'api/zatlas/createService: payload should have name');
  const source = (0, _utils.renderTemplate)('zatlas.createService', payload);
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _assert2.default)(!(0, _fs.existsSync)(filePath), 'api/zatlas/createService: file exists');
  (0, _utils.writeFile)(filePath, source);
}