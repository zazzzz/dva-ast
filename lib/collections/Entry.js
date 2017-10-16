'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _lodash = require('lodash.once');

var _lodash2 = _interopRequireDefault(_lodash);

var _Collection = require('jscodeshift/src/Collection');

var _Collection2 = _interopRequireDefault(_Collection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getImportRequirePath(identifierName, path) {
  const scope = path.scope.lookup(identifierName);
  if (scope) {
    const importPath = scope.getBindings()[identifierName][0].parent.parent;
    const importNode = importPath.value;
    if (_jscodeshift2.default.ImportDeclaration.check(importNode)) {
      return importNode.source.value;
    }
  }
}

function isDvaInstance(identifierName, path) {
  const scope = path.scope.lookup(identifierName);
  if (scope) {
    const declaratorPath = scope.getBindings()[identifierName][0].parent;
    const declaratorNode = declaratorPath.value;
    if (_jscodeshift2.default.VariableDeclarator.check(declaratorNode)) {
      const { init } = declaratorNode;
      if (_jscodeshift2.default.CallExpression.check(init) && _jscodeshift2.default.Identifier.check(init.callee)) {
        return getImportRequirePath(init.callee.name, path) === 'dva';
      }
    }
  }
}

const methods = {

  findModelInjectPoints() {
    const pathes = [];
    this.find(_jscodeshift2.default.CallExpression).forEach(path => {
      const node = path.value;
      if (_jscodeshift2.default.MemberExpression.check(node.callee)) {
        const { object, property } = node.callee;
        if (['model', 'router'].indexOf(property.name) > -1 && isDvaInstance(object.name, path)) {
          pathes.push(path);
        }
      }
    });
    return _Collection2.default.fromPaths(pathes, this);
  },

  addModel(modelPath) {
    const points = this.findModelInjectPoints();
    if (points.size() === 0) return;

    points.forEach(path => {
      const node = path.value;
      const r = node.arguments[0];
      if (_jscodeshift2.default.CallExpression.check(r) && _jscodeshift2.default.Identifier.check(r.callee) && r.callee.name === 'require' && r.arguments && r.arguments.length === 1 && _jscodeshift2.default.Literal.check(r.arguments[0]) && r.arguments[0].value === modelPath) {
        throw new Error(`addModel: model ${modelPath} exists`);
      }
    });

    const { object, property } = points.get().value.callee;
    const insertMethod = property.name === 'model' ? 'insertAfter' : 'insertBefore';

    const collection = points
    // get parent statement
    .map(path => path.parent).at(0);

    collection[insertMethod].call(collection, _jscodeshift2.default.expressionStatement(_jscodeshift2.default.callExpression(_jscodeshift2.default.memberExpression(object, _jscodeshift2.default.identifier('model')), [_jscodeshift2.default.callExpression(_jscodeshift2.default.identifier('require'), [_jscodeshift2.default.literal(modelPath)])])));
  }

};

function register(jscodeshift = _jscodeshift2.default) {
  jscodeshift.registerMethods(methods);
}

exports.default = {
  register: (0, _lodash2.default)(register)
};
module.exports = exports['default'];