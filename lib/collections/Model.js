'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _lodash = require('lodash.once');

var _lodash2 = _interopRequireDefault(_lodash);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _Helper = require('./Helper');

var _Helper2 = _interopRequireDefault(_Helper);

var _index = require('../utils/index');

var utils = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Helper2.default.register();

const _check = (node, name) => {
  return node.type === 'Identifier' && node.name === name || node.type === 'Literal' && node.value === name;
};

const methods = {

  findModels(namespace) {
    return this.find(_jscodeshift2.default.ObjectExpression, node => {
      const props = node.properties.reduce((memo, prop) => {
        if (_jscodeshift2.default.Property.check(prop)) {
          if (prop.key.name === 'namespace') {
            if (!_jscodeshift2.default.Literal.check(prop.value)) {
              return {};
            }
            memo[prop.key.name] = prop.value.value;
          } else {
            memo[prop.key.name] = true;
          }
        }
        return memo;
      }, {});

      if (!props.namespace) return false;
      if (namespace && props.namespace !== namespace) return false;
      // state 不是必须的
      // 但为增加准确性, 还需要声明除 namespace 以外的其他任一项
      return props.state || props.reducers || props.effects || props.subscriptions;
    });
  },

  updateNamespace(newNamespace) {
    return this.forEach(path => {
      path.node.properties.forEach(prop => {
        if (_jscodeshift2.default.Property.check(prop) && prop.key.name === 'namespace') {
          prop.value = _jscodeshift2.default.literal(newNamespace);
        }
      });
    });
  },

  updateState(source) {
    return this.forEach(path => {
      path.node.properties.forEach(prop => {
        if (_jscodeshift2.default.Property.check(prop) && prop.key.name === 'state') {
          prop.value = utils.getExpression(source);
        }
      });
    });
  },

  addState(name, source) {
    this._addModelItem(name, source, {
      itemsKey: 'state',
      defaultSource: '{}'
    });
  },

  addReducer(name, source) {
    this._addModelItem(name, source, {
      itemsKey: 'reducers',
      defaultSource: 'function(state) {\n  return state;\n}'
    });
  },

  addEffect(name, source) {
    this._addModelItem(name, source, {
      itemsKey: 'effects',
      defaultSource: '*function(action, { call, put, select }) {\n}'
    });
  },

  addSubscription(name, source) {
    this._addModelItem(name, source, {
      itemsKey: 'subscriptions',
      defaultSource: 'function({ dispatch, history }) {\n}'
    });
  },

  /**
   * @private
   */
  _addModelItem(name, source, { itemsKey, defaultSource }) {
    return this.forEach(path => {
      let items = null;
      path.node.properties.forEach(prop => {
        if (_jscodeshift2.default.Property.check(prop) && prop.key.name === itemsKey) {
          (0, _assert2.default)(_jscodeshift2.default.ObjectExpression.check(prop.value), `_addModelItem: ${itemsKey} should be ObjectExpression, but got ${prop.value.type}`);
          items = prop;
        }
      });

      if (!items) {
        items = _jscodeshift2.default.property('init', _jscodeshift2.default.identifier(itemsKey), _jscodeshift2.default.objectExpression([]));
        path.node.properties.push(items);
      }

      const item = _jscodeshift2.default.property('init', _jscodeshift2.default.identifier(name), utils.getExpression(source || defaultSource));
      items.value.properties.push(item);
    });
  },

  updateReducer(name, source) {
    this._updateModelItem(name, source, {
      itemsKey: 'reducers'
    });
  },

  updateEffect(name, source) {
    this._updateModelItem(name, source, {
      itemsKey: 'effects'
    });
  },

  updateSubscription(name, source) {
    this._updateModelItem(name, source, {
      itemsKey: 'subscriptions'
    });
  },

  /**
   * @private
   */
  _updateModelItem(name, source, { itemsKey }) {
    return this.forEach(path => {
      let items = null;
      path.node.properties.forEach(prop => {
        if (_jscodeshift2.default.Property.check(prop) && prop.key.name === itemsKey) {
          (0, _assert2.default)(_jscodeshift2.default.ObjectExpression.check(prop.value), `_updateModelItem: ${itemsKey} should be ObjectExpression, but got ${prop.value.type}`);
          items = prop;
        }
      });
      (0, _assert2.default)(items, `_updateModelItem: ${itemsKey} not found`);

      let updated = false;
      items.value.properties.forEach(prop => {
        if (_jscodeshift2.default.Property.check(prop) && _check(prop.key, name)) {
          updated = true;
          prop.value = utils.getExpression(source);
        }
      });
      (0, _assert2.default)(updated, `_updateModelItem: ${itemsKey}.${name} not found`);
    });
  },

  removeReducer(name) {
    this._removeModelItem(name, {
      itemsKey: 'reducers'
    });
  },

  removeEffect(name) {
    this._removeModelItem(name, {
      itemsKey: 'effects'
    });
  },

  removeSubscription(name) {
    this._removeModelItem(name, {
      itemsKey: 'subscriptions'
    });
  },

  /**
   * @private
   */
  _removeModelItem(name, { itemsKey }) {
    return this.forEach(path => {
      let items = null;
      path.node.properties.forEach(prop => {
        if (_jscodeshift2.default.Property.check(prop) && prop.key.name === itemsKey) {
          (0, _assert2.default)(_jscodeshift2.default.ObjectExpression.check(prop.value), `_removeModelItem: ${itemsKey} should be ObjectExpression, but got ${prop.value.type}`);
          items = prop;
        }
      });
      (0, _assert2.default)(items, `_removeModelItem: ${itemsKey} not found`);

      let removed = false;
      items.value.properties = items.value.properties.filter(prop => {
        if (_jscodeshift2.default.Property.check(prop) && _check(prop.key, name)) {
          removed = true;
          return false;
        }
        return true;
      });
      (0, _assert2.default)(removed, `_removeModelItem: ${itemsKey}.${name} not found`);
    });
  },

  getModelInfo() {
    const defaultModel = {
      reducers: [],
      effects: [],
      subscriptions: []
    };
    return this.simpleMap(path => {
      const node = path.node;
      const result = node.properties.reduce((memo, prop) => {
        const name = prop.key.name;
        switch (name) {
          case 'namespace':
            memo[name] = prop.value.value;
            return memo;
          case 'state':
            memo[name] = utils.recursiveParse(prop.value);
            return memo;
          case 'reducers':
            memo[name] = parseReducers(prop.value);
            return memo;
          case 'effects':
            memo[name] = parseEffects(prop.value);
            return memo;
          case 'subscriptions':
            memo[name] = parseSubscriptions(prop.value);
            return memo;
          default:
            throw new Error(`getModelProperties: unrecognized property of dva model: ${name}`);
        }
      }, defaultModel);

      // TODO: reducers 等的解析支持 VariableDeclaraction
      // TODO: reducers 等的解析支持通过 import 从外部引入
      // TODO: add id for reducers, effects and subscriptions
      return result;
    });

    function parseBasic(node, parseType, extra) {
      (0, _assert2.default)(node.type === 'ObjectExpression', `getModelProperties: ${parseType} should be ObjectExpression, but got ${node.type}`);
      return node.properties.map(prop => {
        const name = utils.getPropertyValue(prop.key);
        const result = {
          name,
          source: (0, _jscodeshift2.default)(prop.value).toSource()
        };
        if (extra) {
          extra(result, prop.value);
        }
        return result;
      });
    }

    function parseReducers(node) {
      return parseBasic(node, 'reducers');
    }

    function parseEffects(node) {
      return parseBasic(node, 'effects', (result, node) => {
        result.dispatches = (0, _jscodeshift2.default)(node).findDispatchCalls().getActionTypeFromCall();
      });
    }

    function parseSubscriptions(node) {
      return parseBasic(node, 'subscriptions', (result, node) => {
        result.dispatches = (0, _jscodeshift2.default)(node).findDispatchCalls().getActionTypeFromCall();
      });
    }
  }
};

function register(jscodeshift = _jscodeshift2.default) {
  jscodeshift.registerMethods(methods);
}

exports.default = {
  register: (0, _lodash2.default)(register)
};
module.exports = exports['default'];