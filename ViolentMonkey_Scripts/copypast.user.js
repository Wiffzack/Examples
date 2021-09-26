// ==UserScript==
// @name        Simple
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/
// @grant       none
// @version     1.0
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js 
// @include        http://*
// @include        https://*
// @grant               none
// @license             MIT License
// @run-at              document-idle
// ==/UserScript==

// WebGL implementation by NeuroWhAI.
// https://github.com/bloc97/Anime4K/blob/master/web/main.js

function changepreload(){
  try{
      var videos = document.getElementsByTagName("video");
      for(var i=0,l=videos.length; i<l; i++) {
          videos[i].preload = "auto";
      }
  }
  catch(e){
    console.log("preload mod failed");
  }
}

// onselectstart="return false"
// oncut="return false"
// oncopy="return false"
// onpaste="return false"
// ondrag="return false"
// ondrop="return false"

function changeinput(){
  try{
      var inputs = document.getElementsByTagName("input");
      for(var i=0,l=inputs.length; i<l; i++) {
          inputs[i].onselectstart = "";
          inputs[i].oncopy = "";
          inputs[i].onpaste = "";
          inputs[i].ondrag = "";
          inputs[i].ondrop = "";        
      }
  }
  catch(e){
    console.log("preload mod failed");
  }
}

# Angular js ng-click
function buttoncloser(){
  try{
      var buttons = document.getElementsByTagName("button");
      for(var i=0,l=buttons.length; i<l; i++) {
          var close = buttons[i].getAttribute("ng-click");
          if(close==="close()"){
            buttons[i].click(); 
          }
     
      }
  }
  catch(e){
    console.log("preload mod failed");
  }
}


function recreateNode(el, withChildren) {
  if (withChildren) {
    el.parentNode.replaceChild(el.cloneNode(true), el);
  }
  else {
    var newEl = el.cloneNode(false);
    while (el.hasChildNodes()) newEl.appendChild(el.firstChild);
    el.parentNode.replaceChild(newEl, el);
  }
}

function modifybody(){
  recreateNode(document.getElementById("list"), true);
  var body = document.getElementsByTagName("body");
  body.oncontextmenu="";
  document.onmousedown=""; 
  document.onclick="";  
}

# doesnt solve background tricks
function adblockwindows(){
  try{
      var adb = document.querySelectorAll("div[class^='adblock'], div[class*=' AdBlock]");
      for(var i=0,l= adb.length; i<l; i++) {
            adb[i].style.position = "absolute";
            adb[i].style.zIndex = "0";
            adb[i].style.visibility="hidden";
      }
  }
  catch(e){
    console.log("preload mod failed");
  }
}


# style.height
function fullscreenblur(){
  try{
      var blur = document.getElementsByTagName("div");
      for(var i=0,l= blur.length; i<l; i++) {
            if(blur[i].width()==="100%"){
              blur[i].width()="0%";
      }
      }
  }
  catch(e){
    console.log("preload mod failed");
  }
}




//    globalBoard.style.position = "absolute";
//    globalBoard.style.zIndex = "100";

//document.querySelectorAll("div[class^='adblock'], div[class*=' AdBlock]");

//document.addEventListener('contextmenu', event => event.preventDefault());
//<body oncontextmenu="return false;">
//document.removeEventListener('contextmenu', );


changepreload();
changeinput();
modifybody()








