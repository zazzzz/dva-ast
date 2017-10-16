'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = transform;
exports.normalizeResult = normalizeResult;

var _lodash = require('lodash.uniq');

var _lodash2 = _interopRequireDefault(_lodash);

var _RouteComponent = require('./collections/RouteComponent');

var _RouteComponent2 = _interopRequireDefault(_RouteComponent);

var _Model = require('./collections/Model');

var _Model2 = _interopRequireDefault(_Model);

var _Router = require('./collections/Router');

var _Router2 = _interopRequireDefault(_Router);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ID_SEP = '^^';

function transform(file, api) {
  const j = api.jscodeshift;
  _RouteComponent2.default.register(j);
  _Model2.default.register(j);
  _Router2.default.register(j);

  const root = j(file.source);

  const ret = {
    models: root.findModels().getModelInfo(),
    router: root.findRouters().getRouterInfo(),
    routeComponents: root.findRouteComponents().getRouteComponentInfo(root)
  };

  // Only one router.
  if (ret.router && ret.router.length) {
    ret.router = ret.router[0];
  } else {
    ret.router = null;
  }

  return normalizeResult(ret, file.path);
};

function normalizeResult(obj, filePath) {
  const dispatches = {};

  function addDispatch(names, { input: newInput, output: newOutput }) {
    for (let name of names) {
      const dispatch = dispatches[name] || {};
      const input = dispatch.input || [];
      const output = dispatch.output || [];
      dispatches[name] = {
        input: (0, _lodash2.default)(input.concat(newInput || [])),
        output: (0, _lodash2.default)(output.concat(newOutput || []))
      };
    }
  }

  if (obj.routeComponents) {
    for (let rc of obj.routeComponents) {
      rc.filePath = filePath;
      rc.id = `RouteComponent${ID_SEP}${filePath}${ID_SEP}${rc.name}`;
      addDispatch(rc.dispatches, { input: [rc.id] });
    }
  }

  if (obj.models) {
    const reducerByIds = {};
    const effectByIds = {};
    const subscriptionByIds = {};

    for (let model of obj.models) {
      const reducerNames = model.reducers.map(item => item.name);
      const effectNames = model.effects.map(item => item.name);
      const actionMap = reducerNames.concat(effectNames).reduce((memo, key) => {
        memo[key] = true;
        return memo;
      }, {});

      const namespace = model.namespace;
      model.id = `Model${ID_SEP}${filePath}${ID_SEP}${model.namespace}`;
      model.filePath = filePath;

      model.reducers = model.reducers.map(reducer => {
        const id = `Reducer${ID_SEP}${filePath}${ID_SEP}${reducer.name}`;
        addDispatch([`${namespace}/${reducer.name}`], { output: [id] });
        reducerByIds[id] = _extends({}, reducer, { id, filePath, modelId: model.id });
        return id;
      });
      model.effects = model.effects.map(effect => {
        const id = `Effect${ID_SEP}${filePath}${ID_SEP}${effect.name}`;
        addDispatch([`${namespace}/${effect.name}`], { output: [id] });
        const dispatches = effect.dispatches.map(name => {
          const newName = actionMap[name] ? `${model.namespace}/${name}` : name;
          addDispatch([newName], { input: [id] });
          return newName;
        });
        effectByIds[id] = _extends({}, effect, { id, filePath, dispatches, modelId: model.id });
        return id;
      });
      model.subscriptions = model.subscriptions.map(subscription => {
        const id = `Subscription${ID_SEP}${filePath}${ID_SEP}${subscription.name}`;
        const dispatches = subscription.dispatches.map(name => {
          const newName = actionMap[name] ? `${model.namespace}/${name}` : name;
          addDispatch([newName], { input: [id] });
          return newName;
        });
        subscriptionByIds[id] = _extends({}, subscription, { id, filePath, dispatches, modelId: model.id });
        return id;
      });
    }
    obj.models = {
      data: obj.models,
      reducerByIds,
      effectByIds,
      subscriptionByIds
    };
  }

  if (obj.router) {
    obj.router.filePath = filePath;
  }

  obj.dispatches = dispatches;

  return obj;
}