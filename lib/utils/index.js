'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.getExpression = getExpression;
exports.getObjectProperty = getObjectProperty;
exports.getMemberProperty = getMemberProperty;
exports.getPropertyValue = getPropertyValue;
exports.recursiveParse = recursiveParse;

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getExpression(source, opts = {}) {
  const { noParenthesis } = opts;
  const program = (0, _jscodeshift2.default)(noParenthesis ? source : `(${source})`).find(_jscodeshift2.default.Program).get();
  const node = program.node.body[0];
  return node.expression;
}

function getObjectProperty(node, key) {
  (0, _assert2.default)(node.type === 'ObjectExpression', `(utils)getObjectProperty: node is not an Object`);
  for (let prop of node.properties) {
    if (prop.key.name === key) {
      return prop.value;
    }
  }
  return null;
}

function getMemberProperty(node) {
  return getPropertyValue(node.property);
}

function getPropertyValue(node) {
  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'Identifier':
      return node.name;
    default:
      throw new Error('(utils)getPropertyValue: unsupported property type');
  }
}

function recursiveParse(node) {
  if (node.type === 'ObjectExpression') {
    return node.properties.reduce((obj, property) => _extends({}, obj, recursiveParse(property)), {});
  }
  if (node.type === 'Property') {
    let propsName;
    if (node.key.type === 'Identifier') {
      propsName = node.key.name;
    }
    if (node.key.type === 'Literal') {
      propsName = node.key.value;
    }
    return {
      [propsName]: recursiveParse(node.value)
    };
  }
  if (node.type === 'Literal') {
    return node.value;
  }
  if (node.type === 'ArrayExpression') {
    return node.elements.map(recursiveParse);
  }
  if (node.type === 'FunctionExpression') {
    return node;
  }
  return null;
}