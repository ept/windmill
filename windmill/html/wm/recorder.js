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

//Recorder Functionality
//*********************************/
windmill.ui.recorder = new function () {
  var recordState = false;

  this.setRecState = function(){
    if (this.recordState == true){
      this.recordOn();
    }
  }
  //write json to the remote from the click events
  this.writeJsonClicks = function(e){
    if( this.recordState == false){ return; }
    var locator = '';
    var locValue = '';

    if (e.target.id != ""){
      locator = 'id';
      locValue = e.target.id;
    }
    else if ((typeof(e.target.name) != "undefined") && (e.target.name != "")){
      locator = 'name';
      locValue = e.target.name;
    }
    else if (e.target.tagName.toUpperCase() == "A"){
      locator = 'link';
	    locValue = e.target.innerHTML.replace(/(<([^>]+)>)/ig,"");
	    locValue = locValue.replace(/^\s*(.*?)\s*$/,"$1");
    }
    else{
      var xpArray = getXPath(e.target);
      var stringXpath = xpArray.join('/');
           
      locator = 'xpath';
      locValue = '/'+stringXpath;
    } 
    if (locValue != ""){
      var params = {};
      params[locator] = locValue;
     
      if(e.type == 'dblclick'){
	      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('doubleClick', params));
      }
      else{
  	    if (windmill.remote.$("clickOn").checked == true){
    	    windmill.ui.remote.addAction(windmill.ui.remote.buildAction('click', params));
    	  }
  	    else if ((e.target.onclick != null) || (locator == 'link') || (e.target.tagName.toUpperCase() == 'IMG')){
  	      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('click', params));
  	    }
    }
  }
  windmill.ui.remote.scrollRecorderTextArea();
  }
     
  //Writing json to the remote for the change events
  this.writeJsonChange = function(e){          
    
    if( this.recordState == false){ return; }
    var locator = '';
    var locValue = '';
    if (e.target.id != ""){
      locator = 'id';
      locValue = e.target.id;
    }
    else if ((typeof(e.target.name) != "undefined") && (e.target.name != "")){
      locator = 'name';
      locValue = e.target.name;
    }
    else{
      var xpArray = getXPath(e.target);
      var stringXpath = xpArray.join('/');
      locator = 'xpath';
      locValue = stringXpath;
    }
          
    var params = {};
    params[locator] = locValue;

    if (e.target.type == 'textarea'){
      params['text'] = e.target.value;
      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('type', params));

    }
    else if (e.target.type == 'text'){
      params['text'] = e.target.value;
      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('type', params));
    }
    else if (e.target.type == 'password'){
      params['text'] = e.target.value;
      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('type', params));
    }
    else if(e.target.type == 'select-one'){
      params['option'] = e.target.value;
      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('select', params));   
    }
    else if(e.target.type == 'radio'){
      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('radio', params));
    }
    else if(e.target.type == "checkbox"){
      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('check', params));    
    }
          
    windmill.ui.remote.scrollRecorderTextArea();

  }
      
  //Turn on the recorder
  //Since the click event does things like firing twice when a double click goes also
  //and can be obnoxious im enabling it to be turned off and on with a toggle check box
  this.recordOn = function(){
    //Turn off the listeners so that we don't have multiple attached listeners for the same event
    this.recordOff();
    //keep track of the recorder state, for page refreshes
    this.recordState = true;
    windmill.ui.remote.getSuite();
    try{
      this.recRecursiveBind(windmill.testWindow);
    }
    catch(error){
      windmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill, we are getting cross domain exceptions.');
      windmill.remote.$('record').src = 'ide/img/record.png';
      this.recordState = false;
    }
  }
     
  this.recordOff = function(){
    this.recordState = false;
    try{
      this.recRecursiveUnBind(windmill.testWindow);
    }
    catch(error){
      windmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill,'+ 
				      'we are getting cross domain exceptions.' + error);          
    }      
  }
     
  //Recursively bind to all the iframes and frames within
  this.recRecursiveBind = function(frame){
    //Make sure we haven't already bound anything to this frame yet
    this.recRecursiveUnBind(frame);
      
    //IE's onChange support doesn't bubble so we have to manually
    //Attach a listener to every select and input in the app
    if (windmill.browser.isIE != false){
      var inp = frame.document.getElementsByTagName('input');
      for (var i = 0; i < inp.length; i++) { 
	fleegix.event.listen(inp[i], 'onchange', this, 'writeJsonChange');
      }
      var se = frame.document.getElementsByTagName('select');
      for (var i = 0; i < se.length; i++) { 
	fleegix.event.listen(se[i], 'onchange', this, 'writeJsonChange');
      }
    }
      
    fleegix.event.listen(frame.document, 'ondblclick', this, 'writeJsonClicks');
    fleegix.event.listen(frame.document, 'onchange', this, 'writeJsonChange');
    fleegix.event.listen(frame.document, 'onclick', this, 'writeJsonClicks');
      
    var iframeCount = frame.window.frames.length;
    var iframeArray = frame.window.frames;
      
    for (var i=0;i<iframeCount;i++)
      {
        try{
	  fleegix.event.listen(iframeArray[i].document, 'ondblclick', this, 'writeJsonClicks');
	  fleegix.event.listen(iframeArray[i].document, 'onchange', this, 'writeJsonChange');
	  fleegix.event.listen(iframeArray[i].document, 'onclick', this, 'writeJsonClicks');
	  this.recRecursiveBind(iframeArray[i]);
        }
        catch(error){             
          windmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' +
					  'Binding to all others.' + error);     
        }
      }
  }
    
  //Recursively bind to all the iframes and frames within
  this.recRecursiveUnBind = function(frame){
    //IE's onChange support doesn't bubble so we have to manually
    //Attach a listener to every select and input in the app
    if (windmill.browser.isIE != false){
      var inp = frame.document.getElementsByTagName('input');
      for (var i = 0; i < inp.length; i++) { 
	fleegix.event.unlisten(inp[i], 'onchange', this, 'writeJsonChange');
      }
      var se = frame.document.getElementsByTagName('select');
      for (var i = 0; i < se.length; i++) { 
	fleegix.event.unlisten(se[i], 'onchange', this, 'writeJsonChange');
      }
    }
       
    fleegix.event.unlisten(frame.document, 'ondblclick', this, 'writeJsonClicks');
    fleegix.event.unlisten(frame.document, 'onchange', this, 'writeJsonChange');
    fleegix.event.unlisten(frame.document, 'onclick', this, 'writeJsonClicks');
      
    var iframeCount = frame.window.frames.length;
    var iframeArray = frame.window.frames;
      
    for (var i=0;i<iframeCount;i++)
      {
        try{
	  fleegix.event.unlisten(iframeArray[i].document, 'ondblclick', this, 'writeJsonClicks');
	  fleegix.event.unlisten(iframeArray[i].document, 'onchange', this, 'writeJsonChange');
	  fleegix.event.unlisten(iframeArray[i].document, 'onclick', this, 'writeJsonClicks');
	  this.recRecursiveUnBind(iframeArray[i]);
        }
        catch(error){             
          windmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' +
					  'Binding to all others.' + error);     
        }
      }
  }
};
