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

//Mozilla specific Controller functions
//more
Controller.prototype.what = function() {
    alert('Mozilla');
}

//Click function for Mozilla with Chrome
Controller.prototype.click = function(param_object){
      
       var element = this.lookupDispatch(param_object);
       if (!element){
          return false;
        }
          
       element.addEventListener('click', function(evt) {
           preventDefault = evt.getPreventDefault();
       }, false);

       // Trigger the event.
       // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
       Windmill.Events.triggerMouseEvent(element, 'mousedown', true);
       Windmill.Events.triggerMouseEvent(element, 'mouseup', true);
       Windmill.Events.triggerMouseEvent(element, 'click', true);
       
       //Apparently there is some annoying issue with chrome..and this fixes it. Concept from selenium browerbot.
       if (!Windmill.Browser.isChrome && !preventDefault) {
           if (element.href) {
               document.getElementById('webapp').src = element.href;
               
               //if the url is calling JS then its ajax and we don't need to wait for any full page load.. hopefully.
               if (element.href.indexOf('javascript:', 0) == -1){
                    Windmill.XHR.loopState = 0;
                    return true;
                }
           } 
     /*   else if (element.parentNode.href){
               document.getElementById('webapp').src = element.parentNode.href;
               
               if (element.href.indexOf('javascript:', 0) == -1){
                    Windmill.XHR.loopState = 0;
                    //element = "true";
                    return true;
               }
           }*/
       }
 
       return true;
     
};

//there is a problem with checking via click in safari
Controller.prototype.check = function(param_object){
    
    return Windmill.Controller.click(param_object);    
}

//Radio buttons are even WIERDER in safari, not breaking in FF
Controller.prototype.radio = function(param_object){

    return Windmill.Controller.click(param_object);
        
}

//Double click for Mozilla
Controller.prototype.doubleClick = function(param_object) {

 //Look up the dom element, return false if its not there so we can report failure
 var element = this.lookupDispatch(param_object);
 if (!element){
    return false;
 }
    
 Windmill.Events.triggerEvent(element, 'focus', false);

 // Trigger the mouse event.
 Windmill.Events.triggerMouseEvent(element, 'dblclick', true);

 /*if (this._windowClosed()) {
     return;
 }*/

 Windmill.Events.triggerEvent(element, 'blur', false);
 
 return true;
};

/**
 * In non-IE browsers, getElementById() does not search by name.  Instead, we
 * we search separately by id and name.
 */
Controller.prototype.locateElementByIdentifier = function(identifier, inDocument, inWindow) {
    return Windmill.Controller.locateElementById(identifier, inDocument, inWindow)
            || Windmill.Controller.locateElementByName(identifier, inDocument, inWindow)
            || null;
};
