'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRoute = createRoute;
exports.createIndexRoute = createIndexRoute;
exports.createRedirect = createRedirect;
exports.createIndexRedirect = createIndexRedirect;
exports.remove = remove;
exports.moveTo = moveTo;

var _utils = require('./utils');

var _fs = require('fs');

var _path = require('path');

var _relative = require('relative');

var _relative2 = _interopRequireDefault(_relative);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _jscodeshift = require('jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: check react-router version
// assume that router.js is already created
function findRouterNode(root) {
  return root.find(_jscodeshift2.default.JSXElement, {
    openingElement: {
      name: {
        name: 'Switch'
      }
    }
  }).nodes()[0];
}

function findRouteById(root, id) {
  function find(node, parentPath = '', parentId) {
    const type = node.openingElement.name.name;
    const attributes = node.openingElement.attributes;
    let path;
    for (let i = 0; i < attributes.length; i++) {
      if (attributes[i].name.name === 'path') {
        path = attributes[i].value.value;
      }
    }

    let absolutePath;
    if (path) {
      absolutePath = path.charAt(0) === '/' ? path : `${parentPath}/${path}`;
    }

    let currentId;
    if (absolutePath) {
      currentId = `${type}-${absolutePath}`;
    } else if (parentId) {
      currentId = `${type}-parentId_${parentId}`;
    } else {
      currentId = `${type}-root`;
    }

    // found!
    if (currentId === id) return node;

    let found;
    if (node.children) {
      const childElements = node.children.filter(node => node.type === 'JSXElement');
      for (let i = 0; i < childElements.length; i++) {
        found = find(childElements[i], path, currentId);
        if (found) break;
      }
    }
    return found;
  }

  return find(findRouterNode(root), id);
}

// TODO: id 规则需要跟 collection 中复用
function findParentRoute(root, id) {
  if (!id) {
    return findRouterNode(root);
  } else {
    return findRouteById(root, id);
  }
}

function createElement(root, el, attributes = [], parentId) {
  const parentRoute = findParentRoute(root, parentId);
  if (!parentRoute) {
    throw new Error('createRoute, no element find by parentId');
  }
  parentRoute.children.push(_jscodeshift2.default.jsxElement(_jscodeshift2.default.jsxOpeningElement(_jscodeshift2.default.jsxIdentifier(el), attributes.map(attr => {
    if (attr.isExpression) {
      return _jscodeshift2.default.jsxAttribute(_jscodeshift2.default.jsxIdentifier(attr.key), _jscodeshift2.default.jsxExpressionContainer(_jscodeshift2.default.identifier(attr.value)));
    } else if (attr.value) {
      return _jscodeshift2.default.jsxAttribute(_jscodeshift2.default.jsxIdentifier(attr.key), _jscodeshift2.default.literal(attr.value));
    } else {
      return _jscodeshift2.default.jsxAttribute(_jscodeshift2.default.jsxIdentifier(attr.key), null);
    }
  }), true), null, []));
  parentRoute.children.push(_jscodeshift2.default.jsxText('\n'));
}

function __createRoute(payload, type) {
  const { path, component = {}, parentId } = payload;
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  const source = (0, _utils.readFile)(filePath);
  const root = (0, _jscodeshift2.default)(source);
  const parentRoute = findParentRoute(root);

  // append Route
  // TODO: support additonal attributes like components
  const attributes = [];
  if (path) {
    attributes.push({ key: 'path', value: path });
    attributes.push({ key: 'exact', value: null });
  }
  if (component.componentName) {
    attributes.push({ key: 'component', value: component.componentName, isExpression: true });
  }
  createElement(root, type, attributes, parentId);

  if (!component.componentName) return (0, _utils.writeFile)(filePath, root.toSource());
  (0, _assert2.default)(component.filePath, 'api/router/create: payload.component should have filePath');

  // create & import component
  let relativePath;
  const componentFilePath = (0, _path.join)(payload.sourcePath, component.filePath);
  if ((0, _fs.existsSync)(componentFilePath)) {
    relativePath = (0, _relative2.default)(filePath, componentFilePath);
    if (relativePath.charAt(0) !== '.') {
      relativePath = './' + relativePath;
    }
    relativePath = relativePath.split(_path.sep).join('/'); // workaround for windows
  }

  const imports = root.find(_jscodeshift2.default.ImportDeclaration);
  const lastImport = imports.at(imports.size() - 1);
  lastImport.insertAfter(_jscodeshift2.default.importDeclaration([_jscodeshift2.default.importDefaultSpecifier(_jscodeshift2.default.identifier(component.componentName))], _jscodeshift2.default.literal(relativePath)));
  (0, _utils.writeFile)(filePath, root.toSource());
}

function createRoute(payload) {
  const { path, component = {}, parentId } = payload;
  (0, _assert2.default)(payload.path || payload.component && payload.component.componentName, 'api/router/createRoute: payload should at least have path or compnent');
  __createRoute(payload, 'Route');
}

function createIndexRoute(payload) {
  const { component = {}, parentId } = payload;
  (0, _assert2.default)(payload.component && payload.component.componentName, 'api/router/createIndexRoute: payload should at have compnent');
  __createRoute(payload, 'IndexRoute');
}

function createRedirect(payload) {
  (0, _assert2.default)(payload.from && payload.to, 'api/router/createRedirect: payload should have from or to');
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  const source = (0, _utils.readFile)(filePath);
  const root = (0, _jscodeshift2.default)(source);

  createElement(root, 'Redirect', [{ key: 'from', value: payload.from }, { key: 'to', value: payload.to }], payload.parentId);

  (0, _utils.writeFile)(filePath, root.toSource());
}

function createIndexRedirect(payload) {
  (0, _assert2.default)(payload.to, 'api/router/createIndexRedirect: payload should have to');
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  const source = (0, _utils.readFile)(filePath);
  const root = (0, _jscodeshift2.default)(source);

  createElement(root, 'IndexRedirect', [{ key: 'to', value: payload.to }], payload.parentId);

  (0, _utils.writeFile)(filePath, root.toSource());
}

function remove(payload) {
  (0, _assert2.default)(payload.id, 'api/router/remove: payload should have id');
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  const source = (0, _utils.readFile)(filePath);
  const root = (0, _jscodeshift2.default)(source);
  const route = findRouteById(root, payload.id);
  if (!route) {
    throw new Error(`api/router/remove: didn\'t find route by id: ${id}`);
  }

  // don't know why j(route).remove dosen't work
  // here use a workaround, find it again and then remove it.
  // TODO: need to remove the empty line left behind
  root.find(_jscodeshift2.default.JSXElement, {
    start: route.start,
    end: route.end
  }).at(0).remove();

  (0, _utils.writeFile)(filePath, root.toSource());
}

function moveTo(payload) {
  (0, _assert2.default)(payload.id, 'api/router/moveTo: payload should have id & parentId');
  const filePath = (0, _path.join)(payload.sourcePath, payload.filePath);
  const source = (0, _utils.readFile)(filePath);
  const root = (0, _jscodeshift2.default)(source);
  const route = findRouteById(root, payload.id);
  if (!route) {
    throw new Error(`api/router/moveTo: didn\'t find route by id: ${id}`);
  }

  let parentRoute;
  if (payload.parentId) {
    parentRoute = findRouteById(root, payload.parentId);
    if (!parentRoute) {
      throw new Error(`api/router/moveTo: didn\'t find parent route by id: ${parentId}`);
    }
  } else {
    parentRoute = findRouterNode(root);
  }

  root.find(_jscodeshift2.default.JSXElement, {
    start: route.start,
    end: route.end
  }).at(0).remove();

  if (parentRoute.openingElement.selfClosing) {
    parentRoute.openingElement.selfClosing = false;
    parentRoute.closingElement = _jscodeshift2.default.jsxClosingElement(_jscodeshift2.default.jsxIdentifier(parentRoute.openingElement.name.name));
  }

  parentRoute.children.push(_jscodeshift2.default.jsxText('\n'));
  parentRoute.children.push(route);

  (0, _utils.writeFile)(filePath, root.toSource());
}