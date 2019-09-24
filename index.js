'use strict';
module.exports = function PayapiApiClient(config) {
  var log = config.log;
  var client = config.client;

  function returnSomething() {
    return 'Hey, I returned something';
  }

  function touchSomething() {
    log.audit('Someone toucha my spaghetti');
    return;
  }

  function throwSomething() {
    throw new Error('This is something');
  }

  function useFunctionParameters(parameter) {
    return parameter;
  }

  function callingUsingAnObject(parameter) {
    client({
      foo: parameter,
      message: 'Foobar diiba daaba'
    });
    return;
  }

  function doSomethingAsync(params) {
    return new Promise((resolve, reject) => {
      if(params.foo && params.bar) {
        return resolve({
          'foo': params.foo,
          'bar': params.bar
        });
      } else {
        let missingParameter;
        if(!params.foo) {
          missingParameter = 'foo';
        }
        if(!params.bar) {
          missingParameter = 'bar';
        }
        let message = `missing parameter ${missingParameter}`;
        return reject(new Error(message));
      }
    });
  }

  return {
    returnSomething: returnSomething,
    touchSomething: touchSomething,
    throwSomething: throwSomething,
    useFunctionParameters: useFunctionParameters,
    callingUsingAnObject: callingUsingAnObject,
    doSomethingAsync: doSomethingAsync
  };
};
