windmill.jsTest.require('wait_xhr.js');
windmill.jsTest.require('json_dom.js');
windmill.jsTest.require('form_basics.js');

var test_main = new function () {
  this.test_waitForXHR = windmillMain.test_waitForXHR;
  this.test_jsonDom = windmillMain.test_jsonDom;
  this.test_formBasics = windmillMain.test_formBasics;
};

