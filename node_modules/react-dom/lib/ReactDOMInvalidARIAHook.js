/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

var DOMProperty = require('./DOMProperty');
var ReactDebugCurrentFiber = require('./ReactDebugCurrentFiber');

var warning = require('fbjs/lib/warning');

var warnedProperties = {};
var rARIA = new RegExp('^(aria)-[' + DOMProperty.ATTRIBUTE_NAME_CHAR + ']*$');

if (process.env.NODE_ENV !== 'production') {
  var _require = require('react/lib/ReactComponentTreeHook'),
      getStackAddendumByID = _require.getStackAddendumByID;
}

function getStackAddendum(debugID) {
  if (debugID != null) {
    // This can only happen on Stack
    return getStackAddendumByID(debugID);
  } else {
    // This can only happen on Fiber
    return ReactDebugCurrentFiber.getCurrentFiberStackAddendum();
  }
}

function validateProperty(tagName, name, debugID) {
  if (warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
    return true;
  }

  if (rARIA.test(name)) {
    var lowerCasedName = name.toLowerCase();
    var standardName = DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName) ? DOMProperty.getPossibleStandardName[lowerCasedName] : null;

    // If this is an aria-* attribute, but is not listed in the known DOM
    // DOM properties, then it is an invalid aria-* attribute.
    if (standardName == null) {
      warnedProperties[name] = true;
      return false;
    }
    // aria-* attributes should be lowercase; suggest the lowercase version.
    if (name !== standardName) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Unknown ARIA attribute %s. Did you mean %s?%s', name, standardName, getStackAddendum(debugID)) : void 0;
      warnedProperties[name] = true;
      return true;
    }
  }

  return true;
}

function warnInvalidARIAProps(type, props, debugID) {
  var invalidProps = [];

  for (var key in props) {
    var isValid = validateProperty(type, key, debugID);
    if (!isValid) {
      invalidProps.push(key);
    }
  }

  var unknownPropString = invalidProps.map(function (prop) {
    return '`' + prop + '`';
  }).join(', ');

  if (invalidProps.length === 1) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid aria prop %s on <%s> tag. ' + 'For details, see https://fb.me/invalid-aria-prop%s', unknownPropString, type, getStackAddendum(debugID)) : void 0;
  } else if (invalidProps.length > 1) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid aria props %s on <%s> tag. ' + 'For details, see https://fb.me/invalid-aria-prop%s', unknownPropString, type, getStackAddendum(debugID)) : void 0;
  }
}

function validateProperties(type, props, debugID /* Stack only */) {
  if (type.indexOf('-') >= 0 || props.is) {
    return;
  }
  warnInvalidARIAProps(type, props, debugID);
}

var ReactDOMInvalidARIAHook = {
  // Fiber
  validateProperties: validateProperties,
  // Stack
  onBeforeMountComponent: function (debugID, element) {
    if (process.env.NODE_ENV !== 'production' && element != null && typeof element.type === 'string') {
      validateProperties(element.type, element.props, debugID);
    }
  },
  onBeforeUpdateComponent: function (debugID, element) {
    if (process.env.NODE_ENV !== 'production' && element != null && typeof element.type === 'string') {
      validateProperties(element.type, element.props, debugID);
    }
  }
};

module.exports = ReactDOMInvalidARIAHook;