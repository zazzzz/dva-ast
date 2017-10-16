'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (type, payload) {
  // sourcePath 由 server 端额外提供
  (0, _assert2.default)(type, `api: type should be defined`);
  (0, _assert2.default)(payload.sourcePath, `api: payload should have sourcePath`);

  // project.loadAll 逻辑特殊
  if (type === 'project.loadAll') {
    return project.loadAll(payload);
  }

  (0, _assert2.default)(payload.filePath, `api: payload should have filePath`);
  const [cat, method] = type.split(TYPE_SEP);

  (0, _assert2.default)(cat && method, `api: type should be cat.method, e.g. models.create`);
  (0, _assert2.default)(apiMap[cat], `api: cat ${cat} not found`);
  (0, _assert2.default)(apiMap[cat][method], `api: method ${method} of cat ${cat} not found`);

  // 更新物理文件
  const fn = apiMap[cat][method];
  fn(payload);

  // 返回新的 transform 结果
  const { filePath, sourcePath } = payload;
  const absFilePath = (0, _path.join)(sourcePath, filePath);
  if ((0, _fs.existsSync)(absFilePath)) {
    const file = {
      source: (0, _fs.readFileSync)(absFilePath, 'utf-8'),
      path: filePath
    };
    return (0, _transform2.default)(file, { jscodeshift: _jscodeshift2.default });
  }
};

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _path = require('path');

var _transform = require('../transform');

var _transform2 = _interopRequireDefault(_transform);

var _models = require('./models');

var models = _interopRequireWildcard(_models);

var _services = require('./services');

var services = _interopRequireWildcard(_services);

var _routeComponents = require('./routeComponents');

var routeComponents = _interopRequireWildcard(_routeComponents);

var _router = require('./router');

var router = _interopRequireWildcard(_router);

var _project = require('./project');

var project = _interopRequireWildcard(_project);

var _entry = require('./entry');

var entry = _interopRequireWildcard(_entry);

var _components = require('./components');

var components = _interopRequireWildcard(_components);

var _zatlas = require('./zatlas');

var zatlas = _interopRequireWildcard(_zatlas);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TYPE_SEP = '.';
const apiMap = {
  models,
  services,
  routeComponents,
  router,
  project,
  entry,
  components,
  zatlas
};

module.exports = exports['default'];