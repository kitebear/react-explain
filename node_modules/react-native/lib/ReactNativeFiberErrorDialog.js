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

var ExceptionsManager = require('./ExceptionsManager');

/**
 * Intercept lifecycle errors and ensure they are shown with the correct stack
 * trace within the native redbox component.
 */
function ReactNativeFiberErrorDialog(capturedError) {
  var componentStack = capturedError.componentStack,
      error = capturedError.error;


  var errorMessage = void 0;
  var errorStack = void 0;
  var errorType = void 0;

  // Typically Errors are thrown but eg strings or null can be thrown as well.
  if (error && typeof error === 'object') {
    var message = error.message,
        name = error.name;


    var summary = message ? name + ': ' + message : name;

    errorMessage = summary + '\n\nThis error is located at:' + componentStack;
    errorStack = error.stack;
    errorType = error.constructor;
  } else {
    errorMessage = 'Unspecified error at:' + componentStack;
    errorStack = '';
    errorType = Error;
  }

  var newError = new errorType(errorMessage);
  newError.stack = errorStack;

  ExceptionsManager.handleException(newError, false);

  // Return false here to prevent ReactFiberErrorLogger default behavior of
  // logging error details to console.error. Calls to console.error are
  // automatically routed to the native redbox controller, which we've already
  // done above by calling ExceptionsManager.
  return false;
}

module.exports.showDialog = ReactNativeFiberErrorDialog;