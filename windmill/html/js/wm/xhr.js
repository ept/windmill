/*
Copyright 2006-2007, Open Source Applications Foundation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

//Functionality that works for every browser
//Mozilla specific functionality abstracted to mozcontroller.js
//Safari specific functionality abstracted to safcontroller.js
//IE specific functionality abstracted to iecontroller.js
//The reason for this is that the start page only includes the one corresponding
//to the current browser, this means that the functionality in the controller
//object is only for the current browser, and there is only one copy of the code being
//loaded into the browser for performance.
windmill.xhr = new
function() {

    //Keep track of the loop state, running or paused
    this.loopState = false;
    this.timeoutId = null;

    //action callback
    this.actionHandler = function(str) {

        //If the are variables passed we need to do our lex and replace
        if ((str.indexOf('{$') != -1) && (windmill.runTests == true)) {
            str = windmill.controller.handleVariable(str);
        }

        windmill.xhr.xhrResponse = eval('(' + str + ')');

        //If there was a legit json response
        if (windmill.xhr.xhrResponse.error) {
            windmill.ui.results.writeResult("There was a JSON syntax error: '" + 
            windmill.xhr.xhrResponse.error + "'");
        }
        else {
            if (windmill.xhr.xhrResponse.result.method != 'defer') {
                windmill.ui.results.writeStatus("Running " + windmill.xhr.xhrResponse.result.method + "...");
                windmill.ui.playback.setPlaying();
            }
            else {
                windmill.ui.playback.resetPlayBack();
                windmill.ui.results.writeStatus("Waiting for tests...");
            }

            //Init and start performance but not if the protocol defer
            if (windmill.xhr.xhrResponse.result.method != 'defer') {

                //Put on windmill main page that we are running something
                windmill.xhr.action_timer = new TimeObj();
                windmill.xhr.action_timer.setName(windmill.xhr.xhrResponse.result.method);
                windmill.xhr.action_timer.startTime();

                //If the action already exists in the UI, skip all the creating suite stuff
                if (windmill.remote.$(windmill.xhr.xhrResponse.result.params.uuid) != null) {
                    var action = windmill.remote.$(windmill.xhr.xhrResponse.result.params.uuid);
                    action.style.background = 'lightyellow';
                }
                //If its a command we don't want to build any UI
                else if (windmill.xhr.xhrResponse.result.method.split(".")[0] == 'commands') {
                    //do nothing
                    }
                else {
                    var action = windmill.xhr.createActionFromSuite(windmill.xhr.xhrResponse.result.suite_name, windmill.xhr.xhrResponse.result);
                }

                //Forgotten case; If the windmill.runTests is false, but we are trying to change it back to true with a command
                //This fix runs all commands regardless  
                //Run the action
                //If it's a user extension.. run it
                if ((windmill.runTests == true) || (windmill.xhr.xhrResponse.result.method.split(".")[0] == 'commands')) {
                    try {
                        //Wait/open needs to not grab the next action immediately
                        if ((windmill.xhr.xhrResponse.result.method.split(".")[0] == 'waits')) {
                            windmill.controller.stopLoop();
                            windmill.xhr.xhrResponse.result.params.aid = action.id;
                        }
                        if (windmill.xhr.xhrResponse.result.method.indexOf('.') != -1) {
                            //if asserts.assertNotSomething we need to set the result to !result
                            if (windmill.xhr.xhrResponse.result.method.indexOf('asserts.assertNot') != -1) {
                                var mArray = windmill.xhr.xhrResponse.result.method.split(".");
                                var m = mArray[1].replace('Not', '');
                                var result = !windmill.controller[mArray[0]][m](windmill.xhr.xhrResponse.result.params);
                            }
                            //Normal asserts and waits
                            else {
                                var mArray = windmill.xhr.xhrResponse.result.method.split(".");
                                var result = windmill.controller[mArray[0]][mArray[1]](windmill.xhr.xhrResponse.result.params, windmill.xhr.xhrResponse.result);
                            }
                        }
                        //Every other action that isn't namespaced
                        else {
                            var result = windmill.controller[windmill.xhr.xhrResponse.result.method](windmill.xhr.xhrResponse.result.params);
                        }
                    }
                    catch(error) {
                        windmill.ui.results.writeResult("<font color=\"#FF0000\">There was an error in the " + 
                        windmill.xhr.xhrResponse.result.method + " action. " + error + "</font>");
                        windmill.ui.results.writeResult("<br>Action: <b>" + windmill.xhr.xhrResponse.result.method + 
                        "</b><br>Parameters: " + fleegix.json.serialize(windmill.xhr.xhrResponse.result.params) + 
                        "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');

                        result = false;
                        //If the option to throw errors is set
                        if ($('throwDebug').checked == true) {
                            if (console.log) {
                                console.log(error);
                            }
                            else {
                                throw (error);
                            }
                        }
                        else {
                            if (!$('toggleBreak').checked) {
                                windmill.controller.continueLoop();
                            }
                        }
                    }
                }
                else {
                    //we must be loading, change the status to reflect that
                    windmill.ui.results.writeStatus("Loading " + windmill.xhr.xhrResponse.result.method + "...");
                    result == true;
                }
                var m = windmill.xhr.xhrResponse.result.method.split(".");
                //Send the report if it's not in the commands namespace, we only call report for test actions
                if ((m[0] != 'commands') && (m[0] != 'waits') && (windmill.runTests == true)) {
                    //End timer and store
                    windmill.xhr.action_timer.endTime();
                    windmill.xhr.sendReport(windmill.xhr.xhrResponse.result.method, result, windmill.xhr.action_timer);
                    windmill.xhr.setActionBackground(action, result, windmill.xhr.xhrResponse.result);
                    //Do the timer write
                    windmill.xhr.action_timer.write(fleegix.json.serialize(windmill.xhr.xhrResponse.result.params));
                }
            }
        }
        //Get the next action from the service
        setTimeout("windmill.xhr.getNext()", windmill.serviceDelay);

    };

    //Send the report
    this.sendReport = function(method, result, timer) {
        var reportHandler = function(str) {
            response = eval('(' + str + ')');
            if (!response.result == 200) {
                windmill.ui.results.writeResult('Error: Report receiving non 200 response.');
            }
        };
        var result_string = fleegix.json.serialize(windmill.xhr.xhrResponse.result);
        var test_obj = {
            "result": result,
            "uuid": windmill.xhr.xhrResponse.result.params.uuid,
            "starttime": timer.getStart(),
            "endtime": timer.getEnd()
        };
        var json_object = new json_call('1.1', 'report');
        json_object.params = test_obj;
        var json_string = fleegix.json.serialize(json_object);
        //Actually send the report
        fleegix.xhr.doPost(reportHandler, '/windmill-jsonrpc/', json_string);
    };


    //Get the next action from the server
    this.getNext = function() {
        //write to the output tab what is going on
        var handleTimeout = function() {
            windmill.ui.results.writeResult('One of the XHR requests to the server timed out.');
        }

        if (windmill.xhr.loopState) {
            var jsonObject = new json_call('1.1', 'next_action');
            var jsonString = fleegix.json.serialize(jsonObject);

            // Don't trap errors in the XHR call
            fleegix.xhr.debug = true;

            //Execute the post to get the next action
            //Set the xhr timeout to be really high
            //handle the timeout manually
            //Prevent caching
            fleegix.xhr.doReq({
                method: 'POST',
                handleSuccess: this.actionHandler,
                responseFormat: 'text',
                url: '/windmill-jsonrpc/',
                timeoutSeconds: windmill.xhrTimeout,
                handleTimeout: handleTimeout,
                preventCache: true,
                dataPayload: jsonString

            });

        }

    };

    this.clearQueue = function() {
        var h = function(str) {
            windmill.ui.results.writeResult('Cleared backend queue, ' + str);
        }
        var test_obj = {};
        var json_object = new json_call('1.1', 'clear_queue');
        var json_string = fleegix.json.serialize(json_object);
        //Actually send the report
        fleegix.xhr.doPost(h, '/windmill-jsonrpc/', json_string);

    };

    this.createActionFromSuite = function(suiteName, actionObj) {
        //If the suite name is null, set it to default
        if (suiteName == null) {
            suiteName = 'Default';
        }
        var suite = windmill.ui.remote.getSuite(suiteName);

        //Add the action to the suite
        var action = windmill.ui.remote.buildAction(actionObj.method, actionObj.params);
        //var suite = windmill.remote.$(result);
        suite.appendChild(action);
        //IE Hack
        if (windmill.browser.isIE) {
            windmill.remote.$(action.id).innerHTML = action.innerHTML;
        }
        var ide = windmill.remote.$('ide');

        //If the settings box is checked, scroll to the bottom
        if (windmill.remote.$('autoScroll').checked == true) {
            ide.scrollTop = ide.scrollHeight;
        }
        return action;
    };

    this.setActionBackground = function(action, result, obj) {
 
        if (result != true) {
            if (typeof(action) != 'undefined') {
                action.style.background = '#FF9692';
            }
            windmill.ui.results.writeResult("<br>Action: <b>" + obj.method + 
            "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');
            //if the continue on error flag has been set by the shell.. then we just keep on going
            if (windmill.stopOnFailure == true) {
                windmill.xhr.loopState = false;
                windmill.ui.results.writeStatus("Paused, error?...");
            }
        }
        else {
            //Write to the result tab
            windmill.ui.results.writeResult("<br>Action: <b>" + obj.method + 
            "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');
            if ((typeof(action) != 'undefined') && (windmill.runTests == true)) {
                action.style.background = '#C7FFCC';
            }
        }
    };
    this.setWaitBgAndReport = function(aid, result, obj) {
        if (!obj) {
            return false;
        }
        
        var action = $(aid);
        windmill.xhr.action_timer.endTime();

        if (result != true) {
            if (typeof(action) != 'undefined') {
                action.style.background = '#FF9692';
            }
            windmill.ui.results.writeResult("<br>Action: <b>" + obj.method + 
            "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');
            //if the continue on error flag has been set by the shell.. then we just keep on going
            if (windmill.stopOnFailure == true) {
                windmill.xhr.loopState = false;
                windmill.ui.results.writeStatus("Paused, error?...");
            }
        }
        else {
            //Write to the result tab
            windmill.ui.results.writeResult("<br>Action: <b>" + obj.method + 
            "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');
            try {
                if ((typeof(action) != 'undefined') && (windmill.runTests == true)) {
                    action.style.background = '#C7FFCC';
                }
            }
            catch(err) {}
        }
        //Send the report
        windmill.xhr.xhrResponse.result = obj;
        //Don't report if we are running js tests
        if (obj.params.orig != 'js'){
          windmill.xhr.sendReport(obj.method, result, windmill.xhr.action_timer);
        }
        windmill.xhr.action_timer.write(fleegix.json.serialize(obj.params));
    };


};