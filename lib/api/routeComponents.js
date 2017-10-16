'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
exports.remove = remove;
exports.update = update;
exports.addDispatch = addDispatch;

var _utils = require('./utils');

var _index = require('../utils/index');

var _fs = require('fs');

var _path = require('path');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function create(payload) {
  (0, _assert2.default)(payload.componentName, 'api/routeComponents/create: payload should have componentName');
  const source = (0, _utils.renderTemplate)('routeComponents.create', payload);
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _assert2.default)(!(0, _fs.existsSync)(filePath), 'api/routeComponents/create: file exists');
  (0, _utils.writeFile)(filePath, source);

  if (payload.css) {
    let cssFilePath = filePath;
    const en = (0, _path.extname)(filePath);
    if (en) {
      cssFilePath = filePath.slice(0, filePath.lastIndexOf(en));
    }
    cssFilePath = cssFilePath + '.css';
    (0, _utils.writeCSSFile)(cssFilePath, `\r\n.root {\r\n\r\n}\r\n`);
  }
}

function remove(payload) {
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _utils.removeFile)(filePath);
}

function update(payload) {
  (0, _assert2.default)(payload.source, 'api/routeComponents/update: payload should have source');
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  (0, _utils.writeFile)(filePath, payload.source);
}

function addDispatchButton(path, dispatchAction, callback) {
  let once = false;
  const jsxElements = (0, _jscodeshift2.default)(path).find(_jscodeshift2.default.JSXElement, node => {
    if (once) {
      return false;
    } // return false is used to prevent nest traverse
    once = true;
    return node;
  });

  const rootElement = jsxElements.at(0);
  rootElement.__paths[0].value.children.unshift((0, _index.getExpression)(`\r\n<button onClick={() => { ${callback}; }}>click to dispatch ${dispatchAction}</button>\n`));
}

function addDispatch(payload) {
  (0, _assert2.default)(payload.actionType, 'api/routeComponents/addDispatch: payload should have actionType');
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  const source = (0, _utils.readFile)(filePath);
  const root = (0, _jscodeshift2.default)(source);

  root.findRouteComponents().forEach(path => {
    if (path.node.type === 'ClassDeclaration') {
      // add method
      const methodName = `["${payload.actionType}"]`;
      const callMethod = `this${methodName}()`;
      const renderMethod = (0, _jscodeshift2.default)(path).find(_jscodeshift2.default.MethodDefinition, {
        key: {
          type: 'Identifier',
          name: 'render'
        }
      }).at(0);

      renderMethod.insertBefore(_jscodeshift2.default.methodDefinition('method', _jscodeshift2.default.identifier(methodName), (0, _index.getExpression)(`\nfunction() {\n  this.props.dispatch({ type: '${payload.actionType}', payload: {} });\n}`)));

      // add button & callback to render
      addDispatchButton(path, payload.actionType, callMethod);
    } else if (path.node.type === 'FunctionDeclaration') {
      const callFunction = `props.dispatch({ type: '${payload.actionType}', payload: {} })`;
      addDispatchButton(path, payload.actionType, callFunction);
    }
  });

  (0, _utils.writeFile)(filePath, root.toSource());
}