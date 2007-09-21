/*
Copyright 2006, Open Source Applications Foundation

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

//Assertion Explorer Functions
/***************************************/
windmill.ui.assertexplorer = new function () {
  var exploreState = false;
  //this.domExplorerBorder = '';
  
   this.setExploreState = function(){
       if (this.exploreState == true){
         this.assertExplorerOn();
       }
     }
  
    //Reset the border to what it was before the mouse over
    this.resetBorder = function(e){
      e.target.style.border = '';
      //e.target.style.border = this.domExplorerBorder;
    }
    
    //Display the id in the remote
    this.setIdInRemote = function(e){
        //console.log  (typeof(e.target.name));
        var v = null;
        if (e.target.nodeName == "INPUT"){
          v = e.target.value;
        }
        else {
          v = e.target.innerHTML;
        }
        if (e.target.id != ""){
            windmill.remote.$("domExp").innerHTML = "ID: "+ e.target.id+"<br> Content: "+ v;  
        }
        else if ((e.target.name != "") && (typeof(e.target.name) != "undefined")){
            windmill.remote.$("domExp").innerHTML = "Name: "+ e.target.name +"<br> Content: "+ v;  
        }
        else if (e.target.nodeName == "A"){
            windmill.remote.$("domExp").innerHTML = "Link: "+ e.target.innerHTML+"<br> Content: "+ v; 
        }
        else {
           var xpArray = getXPath(e.target);
           var stringXpath = xpArray.join('/');
           windmill.remote.$("domExp").innerHTML = 'XPath: ' + stringXpath +"<br> Content: "+ v;
        }
        //this.domExplorerBorder = e.target.style.border;
        e.target.style.border = "1px solid yellow";
    }
    
    this.aexplorerClick = function(e){
        e.cancelBubble = true;
        if (windmill.browser.isIE == false){
          e.stopPropagation();
          e.preventDefault();      	
        }        
        windmill.remote.window.focus();

        //Setup the params
         var locator = '';
         var locValue = '';
         var params = {};

         if (e.target.id != ""){
            locator = 'id';
            locValue = e.target.id;
         }
         else if ((typeof(e.target.name) != "undefined") && (e.target.name != "")){
            locator = 'name';
            locValue = e.target.name;
         }
         else if (e.target.tagName == "A"){
            locator = 'link';
            locValue = e.target.innerHTML.replace(/(<([^>]+)>)/ig,"");
            locValue = locValue.replace(/^\s*(.*?)\s*$/,"$1");
         }
         else{
           var xpArray = getXPath(e.target);
           var stringXpath = xpArray.join('/');
           
           locator = 'xpath';
           locValue = stringXpath;
         } 
         if (locValue != ""){
            params[locator] = locValue;
         }
        
        if (e.target.tagName == "OPTION"){
          //Drop down, assertSelected
          windmill.ui.remote.addAction(windmill.ui.remote.buildAction('asserts.assertSelected', params));
        } 
        else if (e.target.tagName == "INPUT"){
          //Input box, assertValue
          //e.target.type = "text" or e.target.type = "password"
          params['validator'] = e.target.value;
          windmill.ui.remote.addAction(windmill.ui.remote.buildAction('asserts.assertValue', params));
        }
        else if (e.target.type == "checkbox"){
          //Assert checked
          windmill.ui.remote.addAction(windmill.ui.remote.buildAction('asserts.assertChecked', params));
        }
        else if (e.target.tagName == "DIV"){
          //Assert text
         windmill.ui.remote.addAction(windmill.ui.remote.buildAction('asserts.assertNode', params));
          params['validator'] = e.target.innerHTML;
          windmill.ui.remote.addAction(windmill.ui.remote.buildAction('asserts.assertText', params));
        }
        else if (e.target.tagName == "IMG"){
          //Assert Image Loaded
          windmill.ui.remote.addAction(windmill.ui.remote.buildAction('asserts.assertImageLoaded', params));
        }
        else {
          //Assert Node exists
          windmill.ui.remote.addAction(windmill.ui.remote.buildAction('asserts.assertNode', params));
        }
        this.assertExplorerOff();
        this.resetBorder(e);
    }
    
    //Set the listeners for the dom explorer
    this.assertExplorerOn = function(){
      this.exploreState = true;
      try { 
        windmill.remote.$('assertx').src = 'ide/img/axoff.png';
        windmill.remote.$('domExp').style.visibility = 'visible';
			  windmill.remote.$('domExp').innerHTML = '';
        this.axRecursiveBind(windmill.testingApp);
       }
       catch(error){
        windmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill, '+
        'we are getting cross domain exceptions.');
        windmill.remote.$('assertx').src = 'ide/img/axon.png';
        this.exploreState = false;
      }
    }
    
    //Remove the listeners for the dom explorer
    this.assertExplorerOff = function(){
       this.exploreState = false;
       
       try {
         //Reset the selected element
         windmill.ui.remote.selectedElement = null;
         windmill.remote.$('assertx').src = 'ide/img/axon.png';
         windmill.remote.$('domExp').style.visibility = 'hidden';
         windmill.remote.$('domExp').innerHTML = '';
         this.axRecursiveUnBind(windmill.testingApp);
       }
       catch(error){
         windmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill, '+
         'we are getting cross domain exceptions.');
        }
    }  
    
    //Recursively bind to all the iframes and frames within
    this.axRecursiveBind = function(frame){
      fleegix.event.listen(frame.document, 'onmouseover', this, 'setIdInRemote');
      fleegix.event.listen(frame.document, 'onmouseout', this, 'resetBorder');
      fleegix.event.listen(frame.document, 'onclick', this, 'aexplorerClick');
      
			var iframeCount = frame.window.frames.length;
      var iframeArray = frame.window.frames;
      
			for (var i=0;i<iframeCount;i++)
       {
        try{
           fleegix.event.listen(iframeArray[i].document, 'onmouseover', this, 'setIdInRemote');
           fleegix.event.listen(iframeArray[i].document, 'onmouseout', this, 'resetBorder');
           fleegix.event.listen(iframeArray[i].document, 'onclick', this, 'aexplorerClick');
           this.axRecursiveBind(iframeArray[i]);
        }
        catch(error){             
          windmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain? '+
          'Binding to all others.' + error);     
        }
       }
    }
    
    this.axRecursiveUnBind = function(frame){
      fleegix.event.unlisten(frame.document, 'onmouseover', this, 'setIdInRemote');
      fleegix.event.unlisten(frame.document, 'onmouseout', this, 'resetBorder');
      fleegix.event.unlisten(frame.document, 'onclick', this, 'aexplorerClick');
      
			var iframeCount = frame.window.frames.length;
      var iframeArray = frame.window.frames;
      
			for (var i=0;i<iframeCount;i++)
       {
        try{
           fleegix.event.unlisten(iframeArray[i].document, 'onmouseover', this, 'setIdInRemote');
           fleegix.event.unlisten(iframeArray[i].document, 'onmouseout', this, 'resetBorder');
           fleegix.event.unlisten(iframeArray[i].document, 'onclick', this, 'aexplorerClick');
           this.axRecursiveUnBind(iframeArray[i]);
        }
        catch(error){             
          windmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain? '+
          'Binding to all others.' + error);     
        }
       }
    }
};
