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

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

'use strict';

var ReactFiberReconciler = require('./ReactFiberReconciler');
var ReactInstanceMap = require('./ReactInstanceMap');

var _require = require('./ReactPriorityLevel'),
    AnimationPriority = _require.AnimationPriority;

var emptyObject = require('fbjs/lib/emptyObject');

var UPDATE_SIGNAL = {};

var scheduledAnimationCallback = null;
var scheduledDeferredCallback = null;

var instanceCounter = 0;

var failInBeginPhase = false;

var NoopRenderer = ReactFiberReconciler({
  getRootHostContext: function () {
    if (failInBeginPhase) {
      throw new Error('Error in host config.');
    }
    return emptyObject;
  },
  getChildHostContext: function () {
    return emptyObject;
  },
  getPublicInstance: function (instance) {
    return instance;
  },
  createInstance: function (type, props) {
    var inst = {
      id: instanceCounter++,
      type: type,
      children: [],
      prop: props.prop
    };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
    return inst;
  },
  appendInitialChild: function (parentInstance, child) {
    parentInstance.children.push(child);
  },
  finalizeInitialChildren: function (domElement, type, props) {
    return false;
  },
  prepareUpdate: function (instance, type, oldProps, newProps) {
    return UPDATE_SIGNAL;
  },
  commitMount: function (instance, type, newProps) {
    // Noop
  },
  commitUpdate: function (instance, updatePayload, type, oldProps, newProps) {
    instance.prop = newProps.prop;
  },
  shouldSetTextContent: function (props) {
    return typeof props.children === 'string' || typeof props.children === 'number';
  },
  resetTextContent: function (instance) {},
  shouldDeprioritizeSubtree: function (type, props) {
    return !!props.hidden;
  },
  createTextInstance: function (text, rootContainerInstance, hostContext, internalInstanceHandle) {
    var inst = { text: text, id: instanceCounter++ };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
    return inst;
  },
  commitTextUpdate: function (textInstance, oldText, newText) {
    textInstance.text = newText;
  },
  appendChild: function (parentInstance, child) {
    var index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  },
  insertBefore: function (parentInstance, child, beforeChild) {
    var index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    var beforeIndex = parentInstance.children.indexOf(beforeChild);
    if (beforeIndex === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(beforeIndex, 0, child);
  },
  removeChild: function (parentInstance, child) {
    var index = parentInstance.children.indexOf(child);
    if (index === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(index, 1);
  },
  scheduleAnimationCallback: function (callback) {
    if (scheduledAnimationCallback) {
      throw new Error('Scheduling an animation callback twice is excessive. ' + 'Instead, keep track of whether the callback has already been scheduled.');
    }
    scheduledAnimationCallback = callback;
  },
  scheduleDeferredCallback: function (callback) {
    if (scheduledDeferredCallback) {
      throw new Error('Scheduling deferred callback twice is excessive. ' + 'Instead, keep track of whether the callback has already been scheduled.');
    }
    scheduledDeferredCallback = callback;
  },
  prepareForCommit: function () {},
  resetAfterCommit: function () {}
});

var rootContainers = new Map();
var roots = new Map();
var DEFAULT_ROOT_ID = '<default>';

var ReactNoop = {
  getChildren: function () {
    var rootID = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_ROOT_ID;

    var container = rootContainers.get(rootID);
    if (container) {
      return container.children;
    } else {
      return null;
    }
  },


  // Shortcut for testing a single root
  render: function (element, callback) {
    ReactNoop.renderToRootWithID(element, DEFAULT_ROOT_ID, callback);
  },
  renderToRootWithID: function (element, rootID, callback) {
    var root = roots.get(rootID);
    if (!root) {
      var container = { rootID: rootID, children: [] };
      rootContainers.set(rootID, container);
      root = NoopRenderer.createContainer(container);
      roots.set(rootID, root);
    }
    NoopRenderer.updateContainer(element, root, null, callback);
  },
  unmountRootWithID: function (rootID) {
    var root = roots.get(rootID);
    if (root) {
      NoopRenderer.updateContainer(null, root, null, function () {
        roots['delete'](rootID);
        rootContainers['delete'](rootID);
      });
    }
  },
  findInstance: function (componentOrElement) {
    if (componentOrElement == null) {
      return null;
    }
    // Unsound duck typing.
    var component = componentOrElement;
    if (typeof component.id === 'number') {
      return component;
    }
    var inst = ReactInstanceMap.get(component);
    return inst ? NoopRenderer.findHostInstance(inst) : null;
  },
  flushAnimationPri: function () {
    var cb = scheduledAnimationCallback;
    if (cb === null) {
      return;
    }
    scheduledAnimationCallback = null;
    cb();
  },
  flushDeferredPri: function () {
    var timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Infinity;

    var cb = scheduledDeferredCallback;
    if (cb === null) {
      return;
    }
    scheduledDeferredCallback = null;
    var timeRemaining = timeout;
    cb({
      timeRemaining: function () {
        // Simulate a fix amount of time progressing between each call.
        timeRemaining -= 5;
        if (timeRemaining < 0) {
          timeRemaining = 0;
        }
        return timeRemaining;
      }
    });
  },
  flush: function () {
    ReactNoop.flushAnimationPri();
    ReactNoop.flushDeferredPri();
  },
  performAnimationWork: function (fn) {
    NoopRenderer.performWithPriority(AnimationPriority, fn);
  },


  batchedUpdates: NoopRenderer.batchedUpdates,

  unbatchedUpdates: NoopRenderer.unbatchedUpdates,

  syncUpdates: NoopRenderer.syncUpdates,

  // Logs the current state of the tree.
  dumpTree: function () {
    var _console;

    var rootID = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_ROOT_ID;

    var root = roots.get(rootID);
    var rootContainer = rootContainers.get(rootID);
    if (!root || !rootContainer) {
      console.log('Nothing rendered yet.');
      return;
    }

    var bufferedLog = [];
    function log() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      bufferedLog.push.apply(bufferedLog, args.concat(['\n']));
    }

    function logHostInstances(children, depth) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var indent = '  '.repeat(depth);
        if (typeof child.text === 'string') {
          log(indent + '- ' + child.text);
        } else {
          // $FlowFixMe - The child should've been refined now.
          log(indent + '- ' + child.type + '#' + child.id);
          // $FlowFixMe - The child should've been refined now.
          logHostInstances(child.children, depth + 1);
        }
      }
    }
    function logContainer(container, depth) {
      log('  '.repeat(depth) + '- [root#' + container.rootID + ']');
      logHostInstances(container.children, depth + 1);
    }

    function logUpdateQueue(updateQueue, depth) {
      log('  '.repeat(depth + 1) + 'QUEUED UPDATES');
      var firstUpdate = updateQueue.first;
      if (!firstUpdate) {
        return;
      }

      log('  '.repeat(depth + 1) + '~', firstUpdate && firstUpdate.partialState, firstUpdate.callback ? 'with callback' : '', '[' + firstUpdate.priorityLevel + ']');
      var next;
      while (next = firstUpdate.next) {
        log('  '.repeat(depth + 1) + '~', next.partialState, next.callback ? 'with callback' : '', '[' + firstUpdate.priorityLevel + ']');
      }
    }

    function logFiber(fiber, depth) {
      log('  '.repeat(depth) + '- ' + (fiber.type ? fiber.type.name || fiber.type : '[root]'), '[' + fiber.pendingWorkPriority + (fiber.pendingProps ? '*' : '') + ']');
      if (fiber.updateQueue) {
        logUpdateQueue(fiber.updateQueue, depth);
      }
      var childInProgress = fiber.progressedChild;
      if (childInProgress && childInProgress !== fiber.child) {
        log('  '.repeat(depth + 1) + 'IN PROGRESS: ' + fiber.progressedPriority);
        logFiber(childInProgress, depth + 1);
        if (fiber.child) {
          log('  '.repeat(depth + 1) + 'CURRENT');
        }
      } else if (fiber.child && fiber.updateQueue) {
        log('  '.repeat(depth + 1) + 'CHILDREN');
      }
      if (fiber.child) {
        logFiber(fiber.child, depth + 1);
      }
      if (fiber.sibling) {
        logFiber(fiber.sibling, depth);
      }
    }

    log('HOST INSTANCES:');
    logContainer(rootContainer, 0);
    log('FIBERS:');
    logFiber(root.current, 0);

    (_console = console).log.apply(_console, bufferedLog);
  },
  simulateErrorInHostConfig: function (fn) {
    failInBeginPhase = true;
    try {
      fn();
    } finally {
      failInBeginPhase = false;
    }
  }
};

module.exports = ReactNoop;