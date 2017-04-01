/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactBrowserEventEmitter = require('./ReactBrowserEventEmitter');
var ReactControlledComponent = require('./ReactControlledComponent');
var ReactDOMComponentTree = require('./ReactDOMComponentTree');
var ReactFeatureFlags = require('./ReactFeatureFlags');
var ReactDOMFeatureFlags = require('./ReactDOMFeatureFlags');
var ReactDOMFiberComponent = require('./ReactDOMFiberComponent');
var ReactDOMFrameScheduling = require('./ReactDOMFrameScheduling');
var ReactDOMInjection = require('./ReactDOMInjection');
var ReactGenericBatching = require('./ReactGenericBatching');
var ReactFiberReconciler = require('./ReactFiberReconciler');
var ReactInputSelection = require('./ReactInputSelection');
var ReactInstanceMap = require('./ReactInstanceMap');
var ReactPortal = require('./ReactPortal');

var _require = require('react/lib/React'),
    isValidElement = _require.isValidElement;

var _require2 = require('./ReactFiberDevToolsHook'),
    injectInternals = _require2.injectInternals;

var findDOMNode = require('./findDOMNode');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var createElement = ReactDOMFiberComponent.createElement,
    getChildNamespace = ReactDOMFiberComponent.getChildNamespace,
    setInitialProperties = ReactDOMFiberComponent.setInitialProperties,
    diffProperties = ReactDOMFiberComponent.diffProperties,
    updateProperties = ReactDOMFiberComponent.updateProperties;
var precacheFiberNode = ReactDOMComponentTree.precacheFiberNode,
    updateFiberProps = ReactDOMComponentTree.updateFiberProps;


if (process.env.NODE_ENV !== 'production') {
  var validateDOMNesting = require('./validateDOMNesting');
  var updatedAncestorInfo = validateDOMNesting.updatedAncestorInfo;
}

var DOCUMENT_NODE = 9;

ReactDOMInjection.inject();
ReactControlledComponent.injection.injectFiberControlledHostComponent(ReactDOMFiberComponent);
findDOMNode._injectFiber(function (fiber) {
  return DOMRenderer.findHostInstance(fiber);
});

var eventsEnabled = null;
var selectionInformation = null;

var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;
var DOCUMENT_FRAGMENT_NODE_TYPE = 11;

/**
 * True if the supplied DOM node is a valid node element.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @return {boolean} True if the DOM is a valid DOM node.
 * @internal
 */
function isValidContainer(node) {
  return !!(node && (node.nodeType === ELEMENT_NODE_TYPE || node.nodeType === DOC_NODE_TYPE || node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE));
}

function validateContainer(container) {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }
}

function getReactRootElementInContainer(container) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOC_NODE_TYPE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

function shouldAutoFocusHostComponent(type, props) {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
  }
  return false;
}

var DOMRenderer = ReactFiberReconciler({
  getRootHostContext: function (rootContainerInstance) {
    var ownNamespace = rootContainerInstance.namespaceURI || null;
    var type = rootContainerInstance.tagName;
    var namespace = getChildNamespace(ownNamespace, type);
    if (process.env.NODE_ENV !== 'production') {
      var isMountingIntoDocument = rootContainerInstance.ownerDocument.documentElement === rootContainerInstance;
      var validatedTag = isMountingIntoDocument ? '#document' : type.toLowerCase();
      var _ancestorInfo = updatedAncestorInfo(null, validatedTag, null);
      return { namespace: namespace, ancestorInfo: _ancestorInfo };
    }
    return namespace;
  },
  getChildHostContext: function (parentHostContext, type) {
    if (process.env.NODE_ENV !== 'production') {
      var parentHostContextDev = parentHostContext;
      var _namespace = getChildNamespace(parentHostContextDev.namespace, type);
      var _ancestorInfo2 = updatedAncestorInfo(parentHostContextDev.ancestorInfo, type, null);
      return { namespace: _namespace, ancestorInfo: _ancestorInfo2 };
    }
    var parentNamespace = parentHostContext;
    return getChildNamespace(parentNamespace, type);
  },
  getPublicInstance: function (instance) {
    return instance;
  },
  prepareForCommit: function () {
    eventsEnabled = ReactBrowserEventEmitter.isEnabled();
    selectionInformation = ReactInputSelection.getSelectionInformation();
    ReactBrowserEventEmitter.setEnabled(false);
  },
  resetAfterCommit: function () {
    ReactInputSelection.restoreSelection(selectionInformation);
    selectionInformation = null;
    ReactBrowserEventEmitter.setEnabled(eventsEnabled);
    eventsEnabled = null;
  },
  createInstance: function (type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    var parentNamespace = void 0;
    if (process.env.NODE_ENV !== 'production') {
      // TODO: take namespace into account when validating.
      var hostContextDev = hostContext;
      validateDOMNesting(type, null, null, hostContextDev.ancestorInfo);
      if (typeof props.children === 'string' || typeof props.children === 'number') {
        var string = '' + props.children;
        var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type, null);
        validateDOMNesting(null, string, null, ownAncestorInfo);
      }
      parentNamespace = hostContextDev.namespace;
    } else {
      parentNamespace = hostContext;
    }
    var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
    precacheFiberNode(internalInstanceHandle, domElement);
    updateFiberProps(domElement, props);
    return domElement;
  },
  appendInitialChild: function (parentInstance, child) {
    parentInstance.appendChild(child);
  },
  finalizeInitialChildren: function (domElement, type, props, rootContainerInstance) {
    setInitialProperties(domElement, type, props, rootContainerInstance);
    return shouldAutoFocusHostComponent(type, props);
  },
  prepareUpdate: function (domElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
    if (process.env.NODE_ENV !== 'production') {
      var hostContextDev = hostContext;
      if (typeof newProps.children !== typeof oldProps.children && (typeof newProps.children === 'string' || typeof newProps.children === 'number')) {
        var string = '' + newProps.children;
        var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type, null);
        validateDOMNesting(null, string, null, ownAncestorInfo);
      }
    }
    return diffProperties(domElement, type, oldProps, newProps, rootContainerInstance);
  },
  commitMount: function (domElement, type, newProps, internalInstanceHandle) {
    domElement.focus();
  },
  commitUpdate: function (domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
    // Update the props handle so that we know which props are the ones with
    // with current event handlers.
    updateFiberProps(domElement, newProps);
    // Apply the diff to the DOM node.
    updateProperties(domElement, updatePayload, type, oldProps, newProps);
  },
  shouldSetTextContent: function (props) {
    return typeof props.children === 'string' || typeof props.children === 'number' || typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && typeof props.dangerouslySetInnerHTML.__html === 'string';
  },
  resetTextContent: function (domElement) {
    domElement.textContent = '';
  },
  shouldDeprioritizeSubtree: function (type, props) {
    return !!props.hidden;
  },
  createTextInstance: function (text, rootContainerInstance, hostContext, internalInstanceHandle) {
    if (process.env.NODE_ENV !== 'production') {
      var hostContextDev = hostContext;
      validateDOMNesting(null, text, null, hostContextDev.ancestorInfo);
    }
    var textNode = document.createTextNode(text);
    precacheFiberNode(internalInstanceHandle, textNode);
    return textNode;
  },
  commitTextUpdate: function (textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
  },
  appendChild: function (parentInstance, child) {
    parentInstance.appendChild(child);
  },
  insertBefore: function (parentInstance, child, beforeChild) {
    parentInstance.insertBefore(child, beforeChild);
  },
  removeChild: function (parentInstance, child) {
    parentInstance.removeChild(child);
  },


  scheduleAnimationCallback: ReactDOMFrameScheduling.rAF,

  scheduleDeferredCallback: ReactDOMFrameScheduling.rIC,

  useSyncScheduling: !ReactDOMFeatureFlags.fiberAsyncScheduling
});

ReactGenericBatching.injection.injectFiberBatchedUpdates(DOMRenderer.batchedUpdates);

var warned = false;

function warnAboutUnstableUse() {
  // Ignore this warning is the feature flag is turned on. E.g. for tests.
  process.env.NODE_ENV !== 'production' ? warning(warned || ReactDOMFeatureFlags.useFiber, 'You are using React DOM Fiber which is an experimental renderer. ' + 'It is likely to have bugs, breaking changes and is unsupported.') : void 0;
  warned = true;
}

function renderSubtreeIntoContainer(parentComponent, children, containerNode, callback) {
  validateContainer(containerNode);

  var container = containerNode.nodeType === DOCUMENT_NODE ? containerNode.documentElement : containerNode;
  var root = container._reactRootContainer;
  if (!root) {
    // First clear any existing content.
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    var newRoot = DOMRenderer.createContainer(container);
    root = container._reactRootContainer = newRoot;
    // Initial mount should not be batched.
    DOMRenderer.unbatchedUpdates(function () {
      DOMRenderer.updateContainer(children, newRoot, parentComponent, callback);
    });
  } else {
    DOMRenderer.updateContainer(children, root, parentComponent, callback);
  }
  return DOMRenderer.getPublicRootInstance(root);
}

var ReactDOM = {
  render: function (element, container, callback) {
    validateContainer(container);

    if (ReactFeatureFlags.disableNewFiberFeatures) {
      // Top-level check occurs here instead of inside child reconciler because
      // because requirements vary between renderers. E.g. React Art
      // allows arrays.
      if (!isValidElement(element)) {
        if (typeof element === 'string') {
          invariant(false, 'ReactDOM.render(): Invalid component element. Instead of ' + "passing a string like 'div', pass " + "React.createElement('div') or <div />.");
        } else if (typeof element === 'function') {
          invariant(false, 'ReactDOM.render(): Invalid component element. Instead of ' + 'passing a class like Foo, pass React.createElement(Foo) ' + 'or <Foo />.');
        } else if (element != null && typeof element.props !== 'undefined') {
          // Check if it quacks like an element
          invariant(false, 'ReactDOM.render(): Invalid component element. This may be ' + 'caused by unintentionally loading two independent copies ' + 'of React.');
        } else {
          invariant(false, 'ReactDOM.render(): Invalid component element.');
        }
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      var isRootRenderedBySomeReact = !!container._reactRootContainer;
      var rootEl = getReactRootElementInContainer(container);
      var hasNonRootReactChild = !!(rootEl && ReactDOMComponentTree.getInstanceFromNode(rootEl));

      process.env.NODE_ENV !== 'production' ? warning(!hasNonRootReactChild || isRootRenderedBySomeReact, 'render(...): Replacing React-rendered children with a new root ' + 'component. If you intended to update the children of this node, ' + 'you should instead have the existing children update their state ' + 'and render the new components instead of calling ReactDOM.render.') : void 0;

      process.env.NODE_ENV !== 'production' ? warning(!container.tagName || container.tagName.toUpperCase() !== 'BODY', 'render(): Rendering components directly into document.body is ' + 'discouraged, since its children are often manipulated by third-party ' + 'scripts and browser extensions. This may lead to subtle ' + 'reconciliation issues. Try rendering into a container element created ' + 'for your app.') : void 0;
    }

    return renderSubtreeIntoContainer(null, element, container, callback);
  },
  unstable_renderSubtreeIntoContainer: function (parentComponent, element, containerNode, callback) {
    !(parentComponent != null && ReactInstanceMap.has(parentComponent)) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'parentComponent must be a valid React Component') : _prodInvariant('38') : void 0;
    return renderSubtreeIntoContainer(parentComponent, element, containerNode, callback);
  },
  unmountComponentAtNode: function (container) {
    !isValidContainer(container) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'unmountComponentAtNode(...): Target container is not a DOM element.') : _prodInvariant('40') : void 0;
    warnAboutUnstableUse();

    if (container._reactRootContainer) {
      if (process.env.NODE_ENV !== 'production') {
        var rootEl = getReactRootElementInContainer(container);
        var renderedByDifferentReact = rootEl && !ReactDOMComponentTree.getInstanceFromNode(rootEl);
        process.env.NODE_ENV !== 'production' ? warning(!renderedByDifferentReact, "unmountComponentAtNode(): The node you're attempting to unmount " + 'was rendered by another copy of React.') : void 0;
      }

      // Unmount should not be batched.
      return DOMRenderer.unbatchedUpdates(function () {
        return renderSubtreeIntoContainer(null, null, container, function () {
          container._reactRootContainer = null;
        });
      });
    }
  },


  findDOMNode: findDOMNode,

  unstable_createPortal: function (children, container) {
    var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    // TODO: pass ReactDOM portal implementation as third argument
    return ReactPortal.createPortal(children, container, null, key);
  },


  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  unstable_deferredUpdates: DOMRenderer.deferredUpdates
};

if (typeof injectInternals === 'function') {
  injectInternals({
    findFiberByHostInstance: ReactDOMComponentTree.getClosestInstanceFromNode,
    findHostInstanceByFiber: DOMRenderer.findHostInstance
  });
}

module.exports = ReactDOM;