windmill.jsTest.require('shared.js');

// Only set this up if we're actually testing failures
if (TEST_FAILURES) {
  var test_failures = new function () {
    this.setup = function () {
      throw new Error('Holy crap, setup failed.');
    };
    this.test_evalBadSyntax = function () {
      eval('{{');
      throw new Error('Whoopsie!');
    };
    this.test_throwError = function () {
      throw new Error('Whoopsie!');
    };
    this.test_errorInArrayStyleTest = [
      function () {
        return true;
      },
      function () {
        throw new Error("That's not right ...");
      },
      function () {
        return true;
      }
    ];
    this.test_assertGreaterThanFailure = function () {
      jum.assertGreaterThan(1, 2);
    };
    this.test_assertLessThanFailure = function () {
      jum.assertLessThan(2, 1);
    };
    this.test_waitTimeout = {
      method: "waits.forElement",
      params: {
        id: "myDogHasFleas",
        milliseconds: 1000
      }
    };
    this.test_waitTimeoutInArray = [
      function () {
        return true;
      },
      {
        method: "waits.forElement",
        params: {
          id: "myDogHasFleas",
          milliseconds: 1000
        }
      },
      function () {
        return true;
      }
    ];
    this.test_waitForJSFailureTimeout = {
      method: "waits.forJS",
      params: {
        js: function () { return false; },
        milliseconds: 1000
      }
    };
    /*
    this.test_waitForJSFailureError = {
      method: "waits.forJS",
      params: {
        js: function () { eval('{{'); }
      }
    };
    this.test_ApiMethodDoesntExist = {
      method: "orpen",
      params: { url: windmillTestShared.pages.MAIN }
    };
    */
    this.teardown = function () {
      throw new Error('Teardown failure, bummer.');
    };
  };

}
