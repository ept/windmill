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


//Loader function
function Load(){
		
		var load = document.createElement('div');
    load.id = 'loading';
    load.style.font = '14pt georgia';
    load.style.position = 'absolute';
    load.style.zIndex = '99999';
    load.style.display = 'block';
    load.innerHTML = '<center><img src="ide/img/wlogo.png"><br>Loading <img src="ide/img/loading.gif"></center>';
    document.body.appendChild(load);
    fleegix.dom.center(load);

  //document.getElementById('loading').style.visibility = 'visibile';
    
    var remote = window.open('remote.html','windmill_Remote','width=465,height=500,toolbar=no,'+
    'location=no,directories=no,status=yes,menubar=no,scrollbars=yes,copyhistory=no,resizable=yes');
    if (!remote){
      alert('We detected a popup blocker, please disable it while ' +
      'you are using Windmill as we load the UI in a popup window. This requires a reload of the page.');
    }
  	redirect = function(){
  	  window.location = urlSTR;
    }
    setTimeout('redirect()', 2500);
}