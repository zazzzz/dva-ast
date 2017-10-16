'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UNRESOLVED_IDENTIFIER = undefined;

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _Collection = require('jscodeshift/src/Collection');

var _Collection2 = _interopRequireDefault(_Collection);

var _lodash = require('lodash.once');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.flatten');

var _lodash4 = _interopRequireDefault(_lodash3);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _index = require('../utils/index');

var utils = _interopRequireWildcard(_index);

var _Helper = require('./Helper');

var _Helper2 = _interopRequireDefault(_Helper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Helper2.default.register();

const UNRESOLVED_IDENTIFIER = exports.UNRESOLVED_IDENTIFIER = '__UNRESOLVED_IDENTIFIER__';

const { NodePath } = _jscodeshift2.default.types;

const methods = {

  findRouteComponents() {
    if (!this.hasReactModule()) return _Collection2.default.fromPaths([], this);

    const pathes = [];

    // 支持 ES6 Class
    this.find(_jscodeshift2.default.ClassDeclaration).forEach(path => {
      const superClass = path.node.superClass;
      if (superClass) {
        if (
        // TODO: 处理 Component 和 React.Component 的来源信赖问题
        // class A extends Component {}
        _jscodeshift2.default.Identifier.check(superClass) && superClass.name === 'Component' ||
        // class A extends React.Component {}
        _jscodeshift2.default.MemberExpression.check(superClass) && isReactComponent(superClass)) {
          pathes.push(path);
        }
      }
    });

    this.find(_jscodeshift2.default.FunctionDeclaration).forEach(path => {
      if (hasJSXElement(path)) pathes.push(path);
    });

    // 支持 pure function
    this.find(_jscodeshift2.default.VariableDeclarator, {
      init: {
        type: 'ArrowFunctionExpression'
      }
    }).forEach(path => {
      if (hasJSXElement(path)) pathes.push(path);
    });

    function isReactComponent(node) {
      return node.property.name === 'Component' && node.object.name === 'React';
    }
    function hasJSXElement(path) {
      return (0, _jscodeshift2.default)(path).find(_jscodeshift2.default.JSXElement).size() > 0;
    }

    return _Collection2.default.fromPaths(pathes, this);
  },

  findDispatchCalls() {
    function filterDispatch(path) {
      // TODO: 识别 dispatch 和 put 的 alias
      return path.name === 'dispatch' || path.name === 'put';
    }
    return this.find(_jscodeshift2.default.Identifier, filterDispatch).closest(_jscodeshift2.default.CallExpression);
  },

  findConnects() {
    // TODO: 识别 connect alias
    return this.find(_jscodeshift2.default.CallExpression, {
      callee: {
        type: 'Identifier',
        name: 'connect'
      }
    });
  },

  findMapFunction() {
    return this.map(path => {
      const mapFnNode = path.value.arguments[0];
      if (!mapFnNode) return null;

      switch (mapFnNode.type) {
        case 'ArrowFunctionExpression':
        case 'FunctionExpression':
          return new NodePath(mapFnNode);
        case 'Identifier':
          const scope = path.scope.lookup(mapFnNode.name);
          if (scope) {
            const newPath = scope.getBindings()[mapFnNode.name][0];
            const p = newPath.parent;
            const pNode = p.value;
            if (pNode.type === 'VariableDeclarator') {
              if (pNode.init.type === 'FunctionExpression' || pNode.init.type === 'ArrowFunctionExpression') {
                return new NodePath(pNode.init);
              }
            }
            if (pNode.type === 'FunctionDeclaration') {
              return p;
            }
          }
          throw new Error(`findMapFunction: unresolved`);
        default:
          throw new Error(`findMapFunction: unsupported path type ${mapFnNode.type}`);
      }
    });
  },

  getRouteComponentInfo(root) {
    return this.simpleMap(path => {
      return {
        name: (0, _jscodeshift2.default)(path).getFirstComponentName(),
        source: root.toSource(),
        stateMappings: (() => {
          const mapFunctions = root.findConnects().findMapFunction();
          if (mapFunctions) {
            return mapFunctions.getModulesFromMapFunction();
          }
          return [];
        })(),
        dispatches: (0, _jscodeshift2.default)(path).findDispatchCalls().getActionTypeFromCall()
      };
    });
  },

  getFirstComponentName() {
    const node = this.get().value;
    switch (node.type) {
      case 'VariableDeclarator':
      case 'ClassDeclaration':
      case 'FunctionDeclaration':
        return node.id.name;
      case 'FunctionExpression':
        (0, _assert2.default)(node.id && node.id.name, 'getFirstComponentName: component should not be anonymous');
        return node.id.name;
      default:
        throw new Error('getFirstComponentName: unsupported node.type');
    }
  },

  getModulesFromMapFunction() {
    const result = this.simpleMap(path => {
      const node = path.value;
      const params = node.params;
      if (!params || params.length === 0) {
        return [];
      }

      switch (params[0].type) {
        case 'Identifier':
          return (0, _jscodeshift2.default)(node.body).find(_jscodeshift2.default.MemberExpression, {
            object: {
              type: 'Identifier',
              name: params[0].name
            }
          }).simpleMap(path => {
            return utils.getMemberProperty(path.value);
          });
        case 'ObjectPattern':
          return params[0].properties.map(prop => prop.key.name);
        default:
          throw new Error(`getModulesFromMapFunction: unsupported param type ${params[0].type}`);
      }
    });
    return (0, _lodash4.default)(result);
  },

  getActionTypeFromCall() {
    const ret = this.simpleMap(path => {
      const node = path.node;
      (0, _assert2.default)(node.type === 'CallExpression', `getActionTypeFromCall: should be CallExpression`);
      (0, _assert2.default)(node.arguments.length === 1, `getActionType: dispatch should be called with 1 argument, but got ${node.arguments.length}`);
      const obj = node.arguments[0];

      // TODO: Support dispatch(routerRedux.push({''}));
      if (_jscodeshift2.default.CallExpression.check(obj)) {
        console.warn(`[WARN] getActionTypeFromCall: don't support dispatch with CallExpression yet`);
        return null;
      }

      (0, _assert2.default)(obj.type === 'ObjectExpression', `getActionType: dispatch should be called with Object, but got ${node.type}`);
      const value = utils.getObjectProperty(obj, 'type');
      if (value.type === 'Literal') {
        return value.value;
      } else if (value.type === 'Identifier') {
        const result = (0, _jscodeshift2.default)(path).getVariableDeclarators(_ => value.name);
        if (result.size()) {
          return result.get().value.init.value;
        } else {
          return UNRESOLVED_IDENTIFIER;
        }
      } else if (value.type === 'TemplateLiteral') {
        console.warn(`[WARN] getActionTypeFromCall: unsupported action type ${value.type}`);
      } else {
        throw new Error(`getActionTypeFromCall: unsupported action type ${value.type}`);
      }
    });
    return ret.filter(item => !!item);
  }

};

function register(jscodeshift = _jscodeshift2.default) {
  jscodeshift.registerMethods(methods);
}

exports.default = {
  register: (0, _lodash2.default)(register)
};