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

var invariant = require('fbjs/lib/invariant');

var viewConfigs = new Map();

var prefix = 'topsecret-';

var ReactNativeViewConfigRegistry = {
  register: function (viewConfig) {
    var name = viewConfig.uiViewClassName;
    invariant(!viewConfigs.has(name), 'Tried to register two views with the same name %s', name);
    var secretName = prefix + name;
    viewConfigs.set(secretName, viewConfig);
    return secretName;
  },
  get: function (secretName) {
    var config = viewConfigs.get(secretName);
    invariant(config, 'View config not found for name %s', secretName);
    return config;
  }
};

module.exports = ReactNativeViewConfigRegistry;