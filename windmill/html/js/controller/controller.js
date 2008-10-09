/*
Copyright 2006-2007, Open Source Applications Foundation
 2006, Open Source Applications Foundation
Copyright 2004 ThoughtWorks, Inc

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

/*
 Functionality that works for every browser
 Mozilla specific functionality abstracted to mozcontroller.js
 Safari specific functionality abstracted to safcontroller.js
 IE specific functionality abstracted to iecontroller.js

 The reason for this is that the start page only includes the one corresponding
 to the current browser, this means that the functionality in the controller
 object is only for the current browser, and there is only one copy of the code being
 loaded into the browser for performance.
*/
 
windmill.controller = new function () {
  
  //Some namespacing for controller functionality
  this.extensions           = {};
  this.commands             = {};
  this.asserts              = {};
  this.waits                = {};
    
    
  /*******************************
    /* Helper functions, non user facing
    /* Note: the getControllerMethods command above returns a list of all the user facing functions to the user
    /* And the ones that start with an underscore are ignored in that list
    /* So if you are adding functionality for internal use and doesnt map from json please start with _
    /*******************************/
    
  this._getDocumentStr = function () { return windmill.testWindowStr + '.document'; }
  this._getWindowStr = function() { return windmill.testWindowStr; }
  this._getDocument = function () { return windmill.testWindow.document; }
  this._getWindow = function() { return windmill.testWindow; }
  
  //Translates from the way we are passing objects to functions to the lookups
  this._lookupDispatch = function (param_object){
    var s = null;
    var element = null;
    //If a link was passed, lookup as link
    if(typeof param_object.link != "undefined") {
      s = 'Looking up link '+ param_object.link;
      //element = this.findElement("link=" + param_object.link)
      element = elementslib.Element.LINK(param_object.link);
    }
    
    //if xpath was passed, lookup as xpath
    if(typeof param_object.xpath != "undefined") {
      s = 'Looking up xpath '+ param_object.xpath;        
      //element = this.findElement("xpath=" + param_object.xpath);
      element = elementslib.Element.XPATH(param_object.xpath);
    }
    
    //if id was passed, do as such
    if(typeof param_object.id != "undefined") {
      s = 'Looking up id '+ param_object.id;
      //element = this.findElement("id=" + param_object.id)
      element = elementslib.Element.ID(param_object.id);
    }
    
    //if jsid was passed
    if(typeof param_object.jsid != "undefined") {
      //Here if the user hasn't specified the test window scope
      //we use the default and prepend it, else we eval whatever js they passed
      var jsid; 
      if ((param_object.jsid.indexOf('windmill.testWindow') != -1) || (param_object.jsid.indexOf('_w') != -1)){
        eval ("jsid=" + param_object.jsid + ";");
      }
      else{
        eval ("jsid=" + this._getWindowStr() + '.' +param_object.jsid + ";");
      }
        s = 'Looking up jsid '+ jsid;
        element = elementslib.Element.ID(param_object.id);
    }
    //if name was passed
    if(typeof param_object.name != "undefined") {
      s = 'Looking up name '+ param_object.name;
      //element = this.findElement("name=" + param_object.name)
      element = elementslib.Element.NAME(param_object.name);
    }
    //if name was passed
    if(typeof param_object.classname != "undefined") {
      s = 'Looking up classname '+ param_object.classname;
      element = elementslib.Element.CLASSNAME(param_object.classname);
    }
    //if name was passed
    if(typeof param_object.tagname != "undefined") {
      s = 'Looking up tagname '+ param_object.tagname;
      element = elementslib.Element.TAGNAME(param_object.tagname);
    }
    
    //write out the results to the ide
    windmill.ui.results.writeResult(s);
    //scroll so that the element is in view
    if (element) { element.scrollIntoView(); }
    
    //return the element to be manipulated
    return element;
  };

  //Function to handle the random keyword scenario
  this.handleVariable = function (val){
    var ret = val;
    var matches = val.match(/{\$[^}]*}/g);
    if (matches) {
      for (var i = 0; i < matches.length; i++){
        var m = matches[i];
        if (windmill.varRegistry.hasKey(m)){
          ret = val.replace(m, windmill.varRegistry.getByKey(m));
        }
        //if it doesn't exist and contains the string random we create it (username or pass etc)
        else if (m.indexOf('random') != -1){
          ret = val.replace(m, windmill.varRegistry.addItemCreateValue(m));
        }
      }
    }
    return ret;
  };

/************************************
/* User facing windmill functionality
/************************************/

  //When the service has nothing for us to do  
  this.defer = function (){
    //At some point we may want to display somewhere that we continually get deferred
    //when the backend has nothing for us to do
  };
  
  //After a page is done loading, continue the loop
  this.continueLoop = function (){
      
    cont = function(){
        //If the doc domain has changed
        //and we can't get to it, try updating it
        try {
          var v = opener.document.domain;
        }
        catch(err){
          document.domain = windmill.docDomain;
        }
      
      $('loopLink').innerHTML = 'Pause Service Loop';
      if (windmill.xhr.loopState == false){
        windmill.xhr.loopState = true;
        windmill.xhr.getNext();
      }
    }
    //Just making sure the page is fully loaded
    setTimeout("cont()", 1);
  };

  this.stopLoop = function () {
    windmill.xhr.loopState = false;
  };
  
  //Store an attribute of a DOM element in the variable registry
  this.storeVarFromLocAttrib = function (param_object) {
    var element = this._lookupDispatch(param_object);
    if (!element){ return false; }

    var arr = param_object.options.split('|');
    var varName = arr[0];
    var attrib = arr[1];
    
    var attribValue = element[attrib];
    
    if (windmill.varRegistry.hasKey('{$'+varName+'}')){
      windmill.varRegistry.removeItem('{$'+varName +'}');
      windmill.varRegistry.addItem('{$'+varName +'}', attribValue);
    }
    else{
      windmill.varRegistry.addItem('{$'+varName +'}', attribValue);
    }
    return true;

  }
  
  //expects a name and js param
  this.storeVarFromJS = function (param_object) {
    //extract the options
    var arr = param_object.options.split('|');
    param_object.name = arr[0];
    param_object.js = arr[1];
    
    //make sure we got a valid js string
    if (typeof param_object.js == 'string') {
      try {
        param_object.value = eval.call(windmill.testWindow, param_object.js);
      }
      catch(err){
        param_object.value = "error";
      }
    }
    else{
      param_object.value = "error";
    }
    if (param_object.value == "error"){
      return false;
    }
    //if the code evaled and returned a value add it
    if (windmill.varRegistry.hasKey('{$'+param_object.name +'}')){
      windmill.varRegistry.removeItem('{$'+param_object.name +'}');
      windmill.varRegistry.addItem('{$'+param_object.name +'}',param_object.value);
    }
    else{
      windmill.varRegistry.addItem('{$'+param_object.name +'}',param_object.value);
    }
    return true;
  }

  //open an url in the webapp iframe
  this.open = function (param_object) {
    //clear the domain forwarding cache
    if (param_object.reset == undefined){
      windmill.service.setTestURL(windmill.initialHost); 
    }
    //We need to tell the service where we are before we
    //head to a new page
    try{ opener.location = param_object.url; }
    catch(err){ return false; }
    
    return true;
  };


  /* Select the specified option and trigger the relevant events of the element.*/
  this.select = function (param_object) {
    var element = this._lookupDispatch(param_object);
    if (!element){ return false; }
    /*var locatorType = param_object.locatorType || 'LABEL';
    if (!("options" in element)) {
    //throw new WindmillError("Specified element is not a Select (has no options)");
           
    }*/
    
    /*var locator = this.optionLocatorFactory.fromLocatorString(
  							    locatorType.toLowerCase() + '=' + param_object.option);

    var optionToSelect = locator.findOption(element);*/
    
    //if it's already selected
    if (element.options[element.options.selectedIndex].text == param_object['option']){
      return true;
    }
    if (element.options[element.options.selectedIndex].value == param_object['value']){
      return true;
    }
    
    windmill.events.triggerEvent(element, 'focus', false);
    var optionToSelect = null;
    for (opt = 0; opt < element.options.length; opt++){
      try{
        var el = element.options[opt];
        if (param_object.option != undefined){
          if(el.innerHTML.indexOf(param_object.option) != -1){
            if (el.selected && el.options[opt] == optionToSelect){
              continue;
            }
            optionToSelect = el;
            optionToSelect.selected = true;
            windmill.events.triggerEvent(element, 'change', true);
            break;
          }
        }
        else{
           if(el.value.indexOf(param_object.value) != -1){
              if (el.selected && el.options[opt] == optionToSelect){
                continue;
              }
              optionToSelect = el;
              optionToSelect.selected = true;
              windmill.events.triggerEvent(element, 'change', true);
              break;
            }
        }
      }
      catch(err){}
    }
    if (optionToSelect == null){
      return false;
    }
    return true;
  };
  
  //Drag one eleent to the top x,y coords of another specified element
  this.dragDropElemToElem = function(p){
    windmill.controller.stopLoop();
    //Get the drag and dest
    var drag = this._lookupDispatch(p);
    //create the params for the destination
    var destParams = {};
    for (attrib in p){
      if (attrib.indexOf('opt') != -1){
        destParams[attrib.replace('opt', '')] = p[attrib];
        break;
      }
    }
    var dest = this._lookupDispatch(destParams);
    
    //if one of these elements couldn't be looked up
    if (!drag || !dest){
      windmill.controller.continueLoop();
      return false;
    }
    windmill.controller.dragElem = drag;
    windmill.controller.destElem = dest;
    
    function getCoords(obj) {
    	var curleft = curtop = 0;
    	if (obj.offsetParent) {
        do {
        	curleft += obj.offsetLeft;
        	curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
      }  
      return {left:curleft,top:curtop};
    }
    
    var dragCoords = null;
    var destCoords = null;
    
    //in IE and Mozilla we can use the getBoundingClientRect()
    if ( windmill.browser.isIE || windmill.browser.isGecko) {
      dragCoords = drag.getBoundingClientRect();
      destCoords = dest.getBoundingClientRect();
    }
    else {
      dragCoords = getCoords(drag);
      destCoords = getCoords(dest);
    }
    
    //Do the initial move to the drag element position
    windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, dragCoords.left, dragCoords.top);
    windmill.events.triggerMouseEvent(drag, 'mousedown', true, dragCoords.left, dragCoords.top); //do the mousedown
    //windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, destCoords.left, destCoords.top); //do the move
    //windmill.events.triggerMouseEvent(dest, 'mouseup', true, destCoords.left, destCoords.top);
    //IE doesn't appear to expect a click to complete the simulation
    // if (!windmill.browser.isIE){
    //   windmill.events.triggerMouseEvent(dest, 'click', true, destCoords.left, destCoords.top);
    // }

     windmill.controller.doRem = function(){
         windmill.controller.continueLoop();
     }
     windmill.controller.doMove = function(attrib, startx, starty){
       windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, startx, starty); 
   
       windmill.controller.moveCount--;
       if (windmill.controller.moveCount == 0){
         windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'mouseup', true, startx, starty);
         if (!windmill.browser.isIE){
           windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'click', true, startx, starty);
         }
         setTimeout('windmill.controller.doRem()', 1000);
       }
     }

     windmill.controller.moveCount = 0;
     var startx = dragCoords.left;
     var starty = dragCoords.top;
     var endx = destCoords.left;
     var endy = destCoords.top;
     
     var delay = 0;
     while (startx != endx){
       if (startx < endx){ startx++; }
       else{ startx--; }
       setTimeout("windmill.controller.doMove('left',"+startx+","+starty+")", delay)
       windmill.controller.moveCount++;
       delay = delay + 5;      
     }
       //move the y
      //var delay = 0;
     while (starty != endy){
       if (starty < endy){ starty++; }
       else{ starty--; }
       setTimeout("windmill.controller.doMove('top',"+startx+","+starty+")", delay);
       windmill.controller.moveCount++;
       delay = delay + 5;      
     }
  
    return true;
  }
  
  // this.dragDropElem = function(param_object){
  //        var p = param_object;
  //        var el = this._lookupDispatch(p);
  //        if (!el){ return false; }
  //        
  //        windmill.controller.stopLoop();
  //        windmill.controller.moveCount = 0;
  //        windmill.controller.dragElem = el;
  //        
  //        var dist = p.pixels.split(',');
  //        dist[0] = dist[0].replace('(','');
  //        dist[1] = dist[1].replace(')','');
  //         
  //        var box = el.getBoundingClientRect(); 
  //        var left = box.left;
  //        var top = box.top + 2;
  //        
  //        windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, left, top);
  //        windmill.events.triggerMouseEvent(el, 'mousedown', true, left, top);
  //        // windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, left+100, top);
  //        //        windmill.events.triggerMouseEvent(el, 'mouseup', true, left, top);
  //        
  //        windmill.controller.doRem = function(){
  //            try{
  //              windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'mouseup', true);
  //            }
  //            catch(err){}
  //            windmill.controller.continueLoop();
  //         }
  //         windmill.controller.doMove = function(x,y){
  //           windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, x, y);
  //           windmill.controller.moveCount--;
  //           if (windmill.controller.moveCount == 0){
  //             setTimeout('windmill.controller.doRem()', 1000);
  //           }
  //         }
  //         
  //         var delay = 0;
  //         var i = 0;
  //         var newX = left;
  //         
  //         while(i != dist[0]){
  //           if (i < dist[0]){ newX++; }
  //           else{ newX--; }
  //           
  //           setTimeout("windmill.controller.doMove("+newX+","+top+")", delay)
  //           if (i < dist[0]){ i++; }
  //           else{ i--; }
  //           windmill.controller.moveCount++;
  //           delay = delay + 5;
  //         }
  //         
  //         var delay = 0;
  //         var i = 0;
  //         var newBox = el.getBoundingClientRect(); 
  //         var newY = top;
  //         
  //         while(i != dist[1]){
  //           if (i < dist[0]){ newY++; }
  //           else{ newY--; }
  //           
  //           setTimeout("windmill.controller.doMove("+newBox.left+", "+newY+")", delay)
  //           if (i < dist[1]){ i++; }
  //           else{ i--; }
  //           windmill.controller.moveCount++;
  //           delay = delay + 5;
  //         }
  //        
  //        return true;
  //    }
     
  this.dragDropElem = function(param_object){
         var p = param_object;
         var el = this._lookupDispatch(p);
         if (!el){ return false; }
         windmill.controller.stopLoop();
         windmill.controller.moveCount = 0;
         windmill.controller.dragElem = el;
         
         //ie specific drag and drop simulation
         if (windmill.browser.isIE){
             var dist = p.pixels.split(',');
              dist[0] = dist[0].replace('(','');
              dist[1] = dist[1].replace(')','');

              var box = el.getBoundingClientRect(); 
              var left = box.left;
              var top = box.top + 2;

              windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, left, top);
              windmill.events.triggerMouseEvent(el, 'mousedown', true, left, top);
              // windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, left+100, top);
              //        windmill.events.triggerMouseEvent(el, 'mouseup', true, left, top);

              windmill.controller.doRem = function(x,y){
                  try{
                    windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'mouseup', true, x, y);
                  }
                  catch(err){}
                  windmill.controller.continueLoop();
               }
               windmill.controller.doMove = function(x,y){
                 windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, x, y);
                 windmill.controller.moveCount--;
                 if (windmill.controller.moveCount == 0){
                   setTimeout('windmill.controller.doRem('+x+','+y+')', 1000);
                 }
               }

               var delay = 0;
               var i = 0;
               var newX = left;

               while(i != dist[0]){
                 if (i < dist[0]){ newX++; }
                 else{ newX--; }

                 setTimeout("windmill.controller.doMove("+newX+","+top+")", delay)
                 if (i < dist[0]){ i++; }
                 else{ i--; }
                 windmill.controller.moveCount++;
                 delay = delay + 5;
               }

               //var delay = 0;
               var i = 0;
               var newBox = el.getBoundingClientRect(); 
               var newY = top;

               while(i != dist[1]){
                 if (i < dist[0]){ newY++; }
                 else{ newY--; }

                 setTimeout("windmill.controller.doMove("+newX+", "+newY+")", delay)
                 if (i < dist[1]){ i++; }
                 else{ i--; }
                 windmill.controller.moveCount++;
                 delay = delay + 5;
               }
         }
         //all other browsers with sane event models
         else{
             // var i = windmill.testWindow.document.createElement('img');
             //     i.id = "mc";
             //     i.style.border = "0px";
             //     i.style.left = '0px';
             //     i.style.top = '0px';
             //     i.style.position = "absolute";
             //     i.zIndex = "100000000000";
             //     el.appendChild(i);
             //     i.src = "/windmill-serv/img/mousecursor.png"; 
      
              //takes a coordinates param (x,y),(x,y) start, end
              var dist = p.pixels.split(',');
              dist[0] = dist[0].replace('(','');
              dist[1] = dist[1].replace(')','');
      
              windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, el.offsetLeft, el.offsetTop);
              windmill.events.triggerMouseEvent(el, 'mousedown', true);
              
              windmill.controller.doRem = function(){
                 windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'mouseup', true);
                 windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'click', true);
                 windmill.controller.continueLoop();
              }
              windmill.controller.doMove = function(x,y){
                windmill.events.triggerMouseEvent(_w.document.body, 'mousemove', true, x, y);
                windmill.controller.moveCount--;
                if (windmill.controller.moveCount == 0){
                  setTimeout('windmill.controller.doRem()', 1000);
                }
              }
      
              var delay = 0;
              var i = 0;
              while(i != dist[0]){
                setTimeout("windmill.controller.doMove("+i+", 0)", delay)
                if (i < dist[0]){ i++; }
                else{ i--; }
                windmill.controller.moveCount++;
                delay = delay + 5;
              }
              
              var newX = i;
              //var delay = 0;
              var i = 0;
              while(i != dist[1]){
                setTimeout("windmill.controller.doMove("+newX+", "+i+")", delay)
                if (i < dist[1]){ i++; }
                else{ i--; }
                windmill.controller.moveCount++;
                delay = delay + 5;
              }
          }
          
          return true;
     }
  
  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.dragDropAbs = function (param_object){
     var p = param_object;
     var el = this._lookupDispatch(p)
     if (!el){ return false; }
    
     windmill.controller.stopLoop();
     windmill.controller.moveCount = 0;
     windmill.controller.ddeParamObj = param_object;
     
     var webApp = windmill.testWindow;
     //takes a coordinates param (x,y),(x,y) start, end
     var coords = p.coords.split('),(');
     
     var start = coords[0].split(',');
     start[0] = start[0].replace('(','');
     
     var end = coords[1].split(',');
     end[1] = end[1].replace(')','');
     
     //get to the starting point
      var i = windmill.testWindow.document.createElement('img');
      i.id = "mc";
      i.style.border = "0px";
      i.style.left = start[0]+'px';
      i.style.top = start[1]+'px';
      i.style.position = "absolute";
      i.zIndex = "100000000000";
      windmill.testWindow.document.body.appendChild(i);
      i.src = "/windmill-serv/img/mousecursor.png";
     
     windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, start[0], start[1]);
     windmill.events.triggerMouseEvent(this._lookupDispatch(p), 'mousedown', true, start[0], start[1]);
     var startx = start[0];
     var starty = start[1];
   
     windmill.controller.remMouse = function(x,y){
       windmill.events.triggerMouseEvent(windmill.controller._lookupDispatch(p), 'mouseup', true, x, y);
       windmill.events.triggerMouseEvent(windmill.controller._lookupDispatch(p), 'click', true);
       var c = windmill.testWindow.document.getElementById('mc');
       windmill.testWindow.document.body.removeChild(c);
       windmill.controller.continueLoop();
     }
   
     windmill.controller.doMove = function(attrib, startx, starty){
       var w = windmill.testWindow.document;
       if (attrib == "left"){ w.getElementById('mc').style['left'] = startx+'px'; }
       else{ w.getElementById('mc').style['top'] = starty+'px'; }
       windmill.events.triggerMouseEvent(w.body, 'mousemove', true, startx, starty); 
     
       windmill.controller.moveCount--;
       if (windmill.controller.moveCount == 0){
         w.getElementById('mc').src = "/windmill-serv/img/mousecursorred.png";
         setTimeout('windmill.controller.remMouse('+startx+','+starty+')', 1500);
       }
     }
   
     //move the x
     var delay = 0;
     while (startx != end[0]){
       if (startx < end[0]){ startx++; }
       else{ startx--; }
       setTimeout("windmill.controller.doMove('left',"+startx+","+starty+")", delay)
       windmill.controller.moveCount++;
       delay = delay + 5;      
     }
     //move the y
     //var delay = 0;
     while (starty != end[1]){
        if (starty < end[1]){ starty++; }
        else{ starty--; }
        setTimeout("windmill.controller.doMove('top',"+startx+","+starty+")", delay);
        windmill.controller.moveCount++;
        delay = delay + 5;      
      }
     return true;
   };


  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.dragDrop = function (param_object){   
   
    var p = param_object;
    var hash_key;
     
    eval ("hash_key=" + p.dragged.jsid + ";");
    p.dragged.id = hash_key;
    delete p.dragged.jsid;
             
    function getPos(elem, evType) {
      // param_object.mouseDownPos or param_obj.mouseUpPos
      var t = evType + 'Pos';
      var res = [];
      // Explicit function for getting XY of both
      // start and end position for drag  start 
      // to be calculated from the initial pos of the
      // dragged, and end to be calculated from the
      // position of the destination
      if (p[t]) {
        var f = eval(p[t]);
        res = f(elem);
      }
      // Otherwise naively assume top/left XY for both
      // start (dragged) and end (destination)
      else {
        res = [elem.offsetLeft, elem.offsetTop];
      }
       
      return res;
  }
                
    
    var dragged = this._lookupDispatch(p.dragged);
    var dest = this._lookupDispatch(p.destination);
    var mouseDownPos = getPos(dragged, 'mouseDown');
    var mouseUpPos = getPos(dest, 'mouseUp');
    
    var webApp = windmill.testWindow;
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, mouseDownPos[0], mouseDownPos[1]);
    windmill.events.triggerMouseEvent(dragged, 'mousedown', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, mouseUpPos[0], mouseUpPos[1]);
    windmill.events.triggerMouseEvent(dragged, 'mouseup', true);
    windmill.events.triggerMouseEvent(dragged, 'click', true);
        
    return true;
  };

  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.dragDropXY = function (param_object){

    var p = param_object;
    var webApp = windmill.testWindow;
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.source[0], p.source[1]);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousedown', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.destination[0], p.destination[1]);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mouseup', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'click', true);

    return true;
  };
   
  //Functions for interacting with the windmill variable storage
  //Store the url of a provided link on the page, to be accessed later
  //Ususally with an open
  this.storeURL = function(param_object){
    var linkNode = this._lookupDispatch(param_object);
    if (linkNode){
      windmill.varRegistry.addItem('{$'+param_object.link +'}',linkNode.href);
      return true;
    }
    else{
      return false;
    }
  }
  
  //Allow the user to update the document.domain for the IDE
  this.setDocDomain = function(param_object){
    document.domain = param_object.domain;
    return true;
  }


  //Directly access mouse events
  this.mouseDown = function (param_object){
      var mupElement = this._lookupDispatch(param_object);
      if (mupElement == null){
        mupElement = windmill.testWindow.document.body;
      }
      if (windmill.browser.isIE){
          var box = mupElement.getBoundingClientRect(); 
          var left = box.left;
          var top = box.top + 2;
          windmill.events.triggerMouseEvent(mupElement, 'mousedown', true, left, top);  
      }
      else { windmill.events.triggerMouseEvent(mupElement, 'mousedown', true);  }
    
      return true;
  };
    //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.mouseMoveTo = function (param_object){
    var p = param_object;
    var webApp = windmill.testWindow;
    var coords = p.coords.split(',');
    coords[0] = coords[0].replace('(','');
    coords[1] = coords[1].replace(')','');
    
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, coords[0], coords[1]);
    return true;
  };
  
  // this.mouseMove = function (param_object){
  //    var p = param_object;
  //    var webApp = windmill.testWindow;
  //    var coords = p.coords.split('),(');
  //          
  //    var start = coords[0].split(',');
  //    start[0] = start[0].replace('(','');
  //           
  //    var end = coords[1].split(',');
  //    end[1] = end[1].replace(')','');
  //    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, start[0], start[1]);
  //    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, end[0], end[1]);
  //    alert('mooch??');
  //      
  //   return true;
  // };
    
    //Drag Drop functionality allowing functions passed to calculate cursor offsets
    this.mouseMove = function (param_object){
       windmill.controller.stopLoop();
       windmill.controller.moveCount = 0;
       var p = param_object;
       var webApp = windmill.testWindow;
       //takes a coordinates param (x,y),(x,y) start, end
       var coords = p.coords.split('),(');
       
       var start = coords[0].split(',');
       start[0] = start[0].replace('(','');
       
       var end = coords[1].split(',');
       end[1] = end[1].replace(')','');
    
       //get to the starting point
        var i = windmill.testWindow.document.createElement('img');
        i.id = "mc";
        i.style.border = "0px";
        i.style.left = start[0]+'px';
        i.style.top = start[1]+'px';
        i.style.position = "absolute";
        i.zIndex = "100000000000";
        windmill.testWindow.document.body.appendChild(i);
        i.src = "/windmill-serv/img/mousecursor.png";
       
       windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, start[0], start[1]);
       var startx = start[0];
       var starty = start[1];
     
       windmill.controller.remMouse = function(){
         var c = windmill.testWindow.document.getElementById('mc');
         windmill.testWindow.document.body.removeChild(c);
         windmill.controller.continueLoop();
       }
     
       windmill.controller.doMove = function(attrib, startx, starty){
         var w = windmill.testWindow.document;
         if (attrib == "left"){ w.getElementById('mc').style['left'] = startx+'px'; }
         else{ w.getElementById('mc').style['top'] = starty+'px'; }
         windmill.events.triggerMouseEvent(w.body, 'mousemove', true, startx, starty); 
       
         windmill.controller.moveCount--;
         if (windmill.controller.moveCount == 0){
           w.getElementById('mc').src = "/windmill-serv/img/mousecursorred.png";
           setTimeout('windmill.controller.remMouse()', 1000);
         }
       }
     
       //move the x
       var delay = 0;
       while (startx != end[0]){
         if (startx < end[0]){ startx++; }
         else{ startx--; }
         setTimeout("windmill.controller.doMove('left',"+startx+","+starty+")", delay)
         windmill.controller.moveCount++;
         delay = delay + 5;      
       }
       //move the y
       //var delay = 0;
       while (starty != end[1]){
          if (starty < end[1]){ starty++; }
          else{ starty--; }
          setTimeout("windmill.controller.doMove('top',"+startx+","+starty+")", delay);
          windmill.controller.moveCount++;
          delay = delay + 5;      
        }
       return true;
     };
  
  this.mouseUp = function (param_object){
    var mdnElement = this._lookupDispatch(param_object);
    if (mdnElement == null){
      mdnElement = windmill.testWindow.document.body;
    }
    if(windmill.browser.isIE){
      var box = mdnElement.getBoundingClientRect(); 
      var left = box.left;
      var top = box.top + 2;
      windmill.events.triggerMouseEvent(mdnElement, 'mouseup', true, left, top);
    }
    else{
      windmill.events.triggerMouseEvent(mdnElement, 'mouseup', true);
    }
    
    return true;
  };
  
  this.mouseOver = function (param_object){
    var mdnElement = this._lookupDispatch(param_object);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseover', true);
    
    return true;
  };

  this.mouseOut = function (param_object){
    var mdnElement = this._lookupDispatch(param_object);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseout', true);
    
    return true;
  };
  
  //Browser navigation functions
  this.goBack = function(param_object){
    windmill.testWindow.history.back();
    return true;
  }
  this.goForward = function(param_object){
    windmill.testWindow.history.forward();
    return true;
  }
  this.refresh = function(param_object){
    windmill.testWindow.location.reload(true);
    return true;
  }
  
  this.scroll = function(param_object){
    var d = param_object.coords;
    d = d.replace('(','');
    d = d.replace(')','');
    var cArr = d.split(',');
    _w.scrollTo(cArr[0],cArr[1]);
    return true;
  }
  
  //After the app reloads you have to re overwrite the alert function for the TestingApp
  this.reWriteAlert = function(param_object){
    windmill.reAlert = true;
    windmill.testWindow.alert = function(s){
      windmill.ui.results.writeResult("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
    };
    
    rwaRecurse = function(frame){
      var iframeCount = frame.frames.length;
      var iframeArray = frame.frames;
      
      for (var i=0;i<iframeCount;i++){
          try{
  	        iframeArray[i].alert = function(s){
        		  windmill.ui.results.writeResult("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
     	      };
  	        rwaRecurse(iframeArray[i]);
          }
          catch(error){             
           	windmill.ui.results.writeResult('Could not bind to iframe number '+ iframeCount +' '+error);     
          }
        }
    }
    rwaRecurse(windmill.testWindow);
    
    return true;
  };

  //Allow the user to set the testWindow to a different window 
  //or frame within the page 
  this.setTestWindow = function(param_object){
    var res = eval ('windmill.testWindow ='+ param_object.path +';');
    if (typeof(res) != 'undefined'){
      return true;
    }
    return false;
  }

};

