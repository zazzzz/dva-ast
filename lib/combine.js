'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
//import Runner from 'jscodeshift/dist/Runner';


exports.default = combine;

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

var _path = require('path');

var _glob = require('glob');

var _fs = require('fs');

var _transform = require('./transform');

var _transform2 = _interopRequireDefault(_transform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function combine(infos) {
  return Object.keys(infos).reduce((memo, filePath) => {
    return merge(memo, infos[filePath]);
  }, {});
}

function merge(oldInfo, newInfo) {
  return {
    models: combineModels(oldInfo.models, newInfo.models),
    router: combineRouter(oldInfo.router, newInfo.router),
    dispatches: combineDispatches(oldInfo.dispatches, newInfo.dispatches),
    routeComponents: combineRouteComponents(oldInfo.routeComponents, newInfo.routeComponents)
  };
}

function combineModels(oldModels, newModels) {
  if (!oldModels) return newModels;
  return {
    data: [...oldModels.data, ...newModels.data],
    reducerByIds: _extends({}, oldModels.reducerByIds, newModels.reducerByIds),
    effectByIds: _extends({}, oldModels.effectByIds, newModels.effectByIds),
    subscriptionByIds: _extends({}, oldModels.subscriptionByIds, newModels.subscriptionByIds)
  };
}

function combineRouter(oldRouter, newRouter) {
  return oldRouter || newRouter;
}

function combineDispatches(oldDispatches, newDispatches) {
  const ret = _extends({}, oldDispatches);
  for (let key in newDispatches) {
    if (newDispatches.hasOwnProperty(key)) {
      if (!ret[key]) {
        ret[key] = newDispatches[key];
      } else {
        ret[key] = {
          input: [...ret[key].input, ...newDispatches[key].input],
          output: [...ret[key].output, ...newDispatches[key].output]
        };
      }
    }
  }
  return ret;
}

function combineRouteComponents(oldRC = [], newRC) {
  return [...oldRC, ...newRC];
}
module.exports = exports['default'];