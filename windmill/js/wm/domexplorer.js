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

//DOM Explorer Functions
/***************************************/
windmill.ui.domexplorer = new function () {
  var exploreState = false;
  //this.domExplorerBorder = '';
  
  this.setExploreState = function(){
    if (this.exploreState == true){
      this.domExplorerOn();
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
    if (windmill.ui.remote.selectedElement != null){
      windmill.remote.$("domExp").style.visibility = 'hidden';
    }
    if(e.target.id != ""){
      windmill.remote.$("domExp").innerHTML = "ID: "+ e.target.id;  
    }
    else if ((e.target.name != "") && (typeof(e.target.name) != "undefined")){
      windmill.remote.$("domExp").innerHTML = "Name: "+ e.target.name;
    }
    else if (e.target.nodeName == "A"){
      windmill.remote.$("domExp").innerHTML = "Link: "+ e.target.innerHTML;  
    }
    else {
      //windmill.remote.$("domExp").innerHTML = "No identfier available.";
      var xpArray = getXPath(e.target);
      var stringXpath = xpArray.join('/');
      windmill.remote.$("domExp").innerHTML = 'XPath: ' + stringXpath;
    }
    //this.domExplorerBorder = e.target.style.border;
    e.target.style.border = "1px solid yellow";
    this.explorerUpdate(e);
  }
    
  this.explorerUpdate = function(e){
    e.cancelBubble = true;
    if (windmill.browser.isIE == false){
      e.stopPropagation();
      e.preventDefault();      	
    }
    //windmill.remote.window.focus();
    //if an element in the remote has been selected
    if (windmill.ui.remote.selectedElement != null){
      var id = windmill.ui.remote.selectedElement.replace('locator', '');
      //Incase if that node has been removed somehow
      try {
	var a = windmill.remote.$("domExp").innerHTML.split(': ');
	//If the element is a link, get rid of the all the garbage
	if (a[0] == 'link'){
	  a[1] = a[1].replace(/(<([^>]+)>)/ig,"");
	  a[1] = a[1].replace(/\n/g, "");
	}
	windmill.remote.$(id+'locatorType').value =  a[0].toLowerCase(); 
	windmill.remote.$(id+'locator').value = a[1];
	windmill.remote.$(id+'locator').focus();
      }
      catch(error){
	windmill.ui.results.writeResult('Error in dom explorer');
      }
    }
  }
    
  this.explorerClick = function(e){
    windmill.remote.window.focus();
    this.domExplorerOff();
    this.resetBorder(e);
  }
    
  //Set the listeners for the dom explorer
  this.domExplorerOn = function(){
    this.exploreState = true;
    try {
      windmill.remote.$('explorer').src = 'ide/img/xoff.png';
      windmill.remote.$('domExp').style.visibility = 'visible';
      windmill.remote.$('domExp').innerHTML = '';
      this.dxRecursiveBind(windmill.testWindow);
    }
    catch(error){
      windmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill, we are getting cross domain exceptions.');
      windmill.remote.$('explorer').src = 'ide/img/xon.png';
      this.exploreState = false;
    }
  }
    
  //Remove the listeners for the dom explorer
  this.domExplorerOff = function(){
    this.exploreState = false;
       
    try{
      //Reset the selected element
      windmill.ui.remote.selectedElement = null;
      windmill.remote.$('explorer').src = 'ide/img/xon.png';
      windmill.remote.$('domExp').style.visibility = 'hidden';
      windmill.remote.$('domExp').innerHTML = '';
      this.dxRecursiveUnBind(windmill.testWindow);
    }
    catch(error){
      windmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill, we are getting cross domain exceptions.');
      windmill.remote.$('explorer').src = 'ide/img/xon.png';
      this.exploreState = false;
    }
  } 
     
  //Recursively bind to all the iframes and frames within
  this.dxRecursiveBind = function(frame){
    this.dxRecursiveUnBind(frame);
      
    fleegix.event.listen(frame.document, 'onmouseover', this, 'setIdInRemote');
    fleegix.event.listen(frame.document, 'onmouseout', this, 'resetBorder');
    fleegix.event.listen(frame.document, 'onclick', this, 'explorerClick');
      
    var iframeCount = frame.window.frames.length;
    var iframeArray = frame.window.frames;
      
    for (var i=0;i<iframeCount;i++)
      {
        try{
	  fleegix.event.listen(iframeArray[i].document, 'onmouseover', this, 'setIdInRemote');
	  fleegix.event.listen(iframeArray[i].document, 'onmouseout', this, 'resetBorder');
	  fleegix.event.listen(iframeArray[i].document, 'onclick', this, 'explorerClick');
	  this.dxRecursiveBind(iframeArray[i]);
        }
        catch(error){             
          windmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain? Binding to all others.' + error);     
        }
      }
  }
    
  this.dxRecursiveUnBind = function(frame){
    fleegix.event.unlisten(frame.document, 'onmouseover', this, 'setIdInRemote');
    fleegix.event.unlisten(frame.document, 'onmouseout', this, 'resetBorder');
    fleegix.event.unlisten(frame.document, 'onclick', this, 'explorerClick');
      
    var iframeCount = frame.window.frames.length;
    var iframeArray = frame.window.frames;
      
    for (var i=0;i<iframeCount;i++)
      {
        try{
	  fleegix.event.unlisten(iframeArray[i].document, 'onmouseover', this, 'setIdInRemote');
	  fleegix.event.unlisten(iframeArray[i].document, 'onmouseout', this, 'resetBorder');
	  fleegix.event.unlisten(iframeArray[i].document, 'onclick', this, 'explorerClick');
	  this.dxRecursiveUnBind(iframeArray[i]);
        }
        catch(error){             
          windmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain? Binding to all others.' + error);     
        }
      }
  }
};
