'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
exports.remove = remove;
exports.updateNamespace = updateNamespace;
exports.updateState = updateState;
exports.addState = addState;
exports.addReducer = addReducer;
exports.addEffect = addEffect;
exports.addSubscription = addSubscription;
exports.updateReducer = updateReducer;
exports.updateEffect = updateEffect;
exports.updateSubscription = updateSubscription;
exports.removeReducer = removeReducer;
exports.removeEffect = removeEffect;
exports.removeSubscription = removeSubscription;

var _utils = require('./utils');

var _fs = require('fs');

var _path = require('path');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _entry = require('./entry');

var _Model = require('../collections/Model');

var _Model2 = _interopRequireDefault(_Model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Model2.default.register();

function create(payload) {
  (0, _assert2.default)(payload.namespace, 'api/models/create: payload should have namespace');
  const source = (0, _utils.renderTemplate)('models.create', payload);
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _assert2.default)(!(0, _fs.existsSync)(filePath), 'api/models/create: file exists');
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

function remove(payload) {
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _utils.removeFile)(filePath);
}

function updateNamespace(payload) {
  _action('updateNamespace', payload, ['newNamespace']);
}

function updateState(payload) {
  _action('updateState', payload, ['source']);
}

function addState(payload) {
  _action('addState', payload, ['name', 'source'], ['source']);
}

function addReducer(payload) {
  _action('addReducer', payload, ['name', 'source'], ['source']);
}

function addEffect(payload) {
  _action('addEffect', payload, ['name', 'source'], ['source']);
}

function addSubscription(payload) {
  _action('addSubscription', payload, ['name', 'source'], ['source']);
}

function updateReducer(payload) {
  _action('updateReducer', payload, ['name', 'source']);
}

function updateEffect(payload) {
  _action('updateEffect', payload, ['name', 'source']);
}

function updateSubscription(payload) {
  _action('updateSubscription', payload, ['name', 'source']);
}

function removeReducer(payload) {
  _action('removeReducer', payload, ['name']);
}

function removeEffect(payload) {
  _action('removeEffect', payload, ['name']);
}

function removeSubscription(payload) {
  _action('removeSubscription', payload, ['name']);
}

/**
 * private
 */
function _action(type, payload, checklist, optional = []) {
  for (let checkitem of ['namespace', ...checklist]) {
    if (optional.indexOf(checkitem) === -1) {
      (0, _assert2.default)(payload[checkitem], `api/models/${type}: payload should have ${checkitem}`);
    }
  }

  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  const source = (0, _utils.readFile)(filePath);
  const root = (0, _jscodeshift2.default)(source);
  const models = root.findModels(payload.namespace);
  const args = checklist.map(checkitem => payload[checkitem]);
  models[type].apply(models, args);
  (0, _utils.writeFile)(filePath, root.toSource());
}