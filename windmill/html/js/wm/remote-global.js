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

//If the user went directly to remote.html
if (!opener){
  document.location = '/windmill-serv/start.html';
 }
var $ = function(id) {
  return document.getElementById(id);
};
				
var closeDialog = function(id){
  $(id).style.display = 'none';
  $('gray').style.visibility = 'hidden';
};
var openDialog = function(id){
  $(id).style.display = 'block';
  $('gray').style.visibility = 'visible';
};
		
var toggleRec = function(){
  if ($('record').src.indexOf("img/record.png")  != -1){
    windmill.ui.recorder.recordOn();
    opener.window.focus();
    $('record').src = 'img/stoprecord.png';
  }
  else{
    windmill.ui.recorder.recordOff();
    $('record').src = 'img/record.png';
  }
}
  var togglePlay = function(){
    if ($('playback').src.indexOf("img/playback.png")  != -1){
      windmill.xhr.startJsonLoop();
      windmill.ui.playback.sendPlayBack();				
      $('playback').src = 'img/playbackstop.png';
    }
    else{
      $('playback').src = 'img/playback.png';
    }
  }
    var toggleLoop = function(){
      if ($('loopLink').innerHTML.indexOf('Pause') != -1){
	      $('loopLink').innerHTML = 'Resume Loop';
	      windmill.controller.stopLoop();
      }
      else{
	      $('loopLink').innerHTML = 'Pause Loop';
        windmill.controller.continueLoop();  
      }
    }
  
  var toggleExplore = function(){
	  if ($('explorer').src.indexOf("img/xon.png")  != -1){
  	  $('domExp').style.visibility = 'visible';
  	  $('domExp').innerHTML = '';
  	  windmill.ui.domexplorer.domExplorerOn();
  	  opener.window.focus();
  	  $('explorer').src = 'img/xoff.png';
  	}
	 else {
	  $('domExp').style.visibility = 'hidden';
	  windmill.ui.domexplorer.domExplorerOff();
	  $('explorer').src = 'img/xon.png';
	  $('domExp').innerHTML = '';
  	}
 }
	
	var toggleAExplore = function(){

	  if ($('assertx').src.indexOf("img/axon.png")  != -1){
	    $('domExp').style.visibility = 'visible';
	    $('domExp').innerHTML = '';
	    windmill.ui.assertexplorer.assertExplorerOn();
	    opener.window.focus();
	    $('assertx').src = 'img/axoff.png';
	  }
	  else {
	    $('domExp').style.visibility = 'hidden';
	    windmill.ui.assertexplorer.assertExplorerOff();
	    $('assertx').src = 'img/axon.png';
	    $('domExp').innerHTML = '';
	  }
	}
		
	//Scrolling rules when using the IDE
	//This is a pretty insane hack, description inline
	  var scroll = function(){
	    //When someone scrolls we are assuming they no longer want it to jump to the bottom
	    //So here I am turning the auto scrolling off
	    //However if they scroll back to the bottom, we want to turn auto scroll on
	    $('autoScroll').checked = false;

	    var ide = $('ide');
	    var a = ide.scrollTop;
	    var b = ide.scrollHeight - ide.offsetHeight + 1;
	    var c = a - b;
				
	    //If this offset that I get from the above math is less than 4
	    //Then they are back at the bottom and we turn auto scroll back on
	    if (Math.abs(c) < 4){
	      $('autoScroll').checked = true;
	    }
	    //If not we keep auto scroll off
	    else{
	      $('autoScroll').checked = false;
	    }
	  }
		
	    function verticalOnly(item) {
	      item.toolManDragGroup.verticalOnly()
		}

function speak(id, what) {
  var element = document.getElementById(id);
  element.innerHTML = 'Clicked ' + what;
}

function saveOrder(item) {
  var group = item.toolManDragGroup
    var list = group.element.parentNode
    var id = list.getAttribute("id")
    if (id == null) return
		      group.register('dragend', function() {
			  ToolMan.cookies().set("list-" + id, 
						ToolMan.junkdrawer().serializeList(list), 365)
			    })
		  }
		
var doSubmit = function(){ return false; }    
  windmill.remote.init = function () {
    windmill.remote.shell = new fleegix.shell.Shell($('shellForm').shellInput,$('shellOutput'));  		
    windmill.Start();
  };
    
    
