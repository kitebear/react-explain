/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @preventMunge
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReactNativeAttributePayload = require('./ReactNativeAttributePayload');
var TextInputState = require('react-native/lib/TextInputState');
var UIManager = require('react-native/lib/UIManager');

var _require = require('./NativeMethodsMixinUtils'),
    mountSafeCallback = _require.mountSafeCallback,
    warnForStyleProps = _require.warnForStyleProps;

/**
 * This component defines the same methods as NativeMethodsMixin but without the
 * findNodeHandle wrapper. This wrapper is unnecessary for HostComponent views
 * and would also result in a circular require.js dependency (since
 * ReactNativeFiber depends on this component and NativeMethodsMixin depends on
 * ReactNativeFiber).
 */
var ReactNativeFiberHostComponent = function () {
  function ReactNativeFiberHostComponent(tag, viewConfig) {
    _classCallCheck(this, ReactNativeFiberHostComponent);

    this._nativeTag = tag;
    this._children = [];
    this.viewConfig = viewConfig;
  }

  ReactNativeFiberHostComponent.prototype.blur = function blur() {
    TextInputState.blurTextInput(this._nativeTag);
  };

  ReactNativeFiberHostComponent.prototype.focus = function focus() {
    TextInputState.focusTextInput(this._nativeTag);
  };

  ReactNativeFiberHostComponent.prototype.measure = function measure(callback) {
    UIManager.measure(this._nativeTag, mountSafeCallback(this, callback));
  };

  ReactNativeFiberHostComponent.prototype.measureInWindow = function measureInWindow(callback) {
    UIManager.measureInWindow(this._nativeTag, mountSafeCallback(this, callback));
  };

  ReactNativeFiberHostComponent.prototype.measureLayout = function measureLayout(relativeToNativeNode, onSuccess, onFail /* currently unused */
  ) {
    UIManager.measureLayout(this._nativeTag, relativeToNativeNode, mountSafeCallback(this, onFail), mountSafeCallback(this, onSuccess));
  };

  ReactNativeFiberHostComponent.prototype.setNativeProps = function setNativeProps(nativeProps) {
    if (process.env.NODE_ENV !== 'production') {
      warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
    }

    var updatePayload = ReactNativeAttributePayload.create(nativeProps, this.viewConfig.validAttributes);

    UIManager.updateView(this._nativeTag, this.viewConfig.uiViewClassName, updatePayload);
  };

  return ReactNativeFiberHostComponent;
}();

module.exports = ReactNativeFiberHostComponent;