// Polyfill for util.inherits needed by socket.io-client in React Native
if (typeof global.util === 'undefined') {
  global.util = {};
}

if (typeof global.util.inherits === 'undefined') {
  global.util.inherits = function(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    }
  };
}

// Export empty object to make it a valid module
export {};
