/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */
'use strict';

/**
 * Make sure essential globals are available and are patched correctly. Please don't remove this
 * line. Bundles created by react-packager `require` it before executing any application code. This
 * ensures it exists in the dependency graph and can be `require`d.
 * TODO: require this in packager, not in React #10932517
 */

var _prodInvariant = require('./reactProdInvariant');

require('react-native/lib/InitializeCore');

var React = require('react/lib/React');
var ReactComponentEnvironment = require('./ReactComponentEnvironment');
var ReactDefaultBatchingStrategy = require('./ReactDefaultBatchingStrategy');
var ReactEmptyComponent = require('./ReactEmptyComponent');
var ReactGenericBatching = require('./ReactGenericBatching');
var ReactHostComponent = require('./ReactHostComponent');
var ReactNativeComponentEnvironment = require('./ReactNativeComponentEnvironment');
var ReactNativeTextComponent = require('./ReactNativeTextComponent');
var ReactSimpleEmptyComponent = require('./ReactSimpleEmptyComponent');
var ReactUpdates = require('./ReactUpdates');

var findNodeHandle = require('./findNodeHandle');
var invariant = require('fbjs/lib/invariant');

function inject() {
  ReactGenericBatching.injection.injectStackBatchedUpdates(ReactUpdates.batchedUpdates);

  ReactUpdates.injection.injectReconcileTransaction(ReactNativeComponentEnvironment.ReactReconcileTransaction);

  ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);

  ReactComponentEnvironment.injection.injectEnvironment(ReactNativeComponentEnvironment);

  var EmptyComponent = function (instantiate) {
    // Can't import View at the top because it depends on React to make its composite
    var View = require('react-native/lib/View');
    return new ReactSimpleEmptyComponent(React.createElement(View, {
      collapsable: true,
      style: { position: 'absolute' }
    }), instantiate);
  };

  findNodeHandle.injection.injectFindNode(function (instance) {
    return instance;
  });
  findNodeHandle.injection.injectFindRootNodeID(function (instance) {
    return instance;
  });

  ReactEmptyComponent.injection.injectEmptyComponentFactory(EmptyComponent);

  ReactHostComponent.injection.injectTextComponentClass(ReactNativeTextComponent);
  ReactHostComponent.injection.injectGenericComponentClass(function (tag) {
    // Show a nicer error message for non-function tags
    var info = '';
    if (typeof tag === 'string' && /^[a-z]/.test(tag)) {
      info += ' Each component name should start with an uppercase letter.';
    }
    !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected a component class, got %s.%s', tag, info) : _prodInvariant('18', tag, info) : void 0;
  });
}

module.exports = {
  inject: inject
};