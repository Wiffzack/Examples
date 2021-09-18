// ==UserScript==
// @name        Simple Canvas Copy
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/watch
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @grant       none
// @version     1.0
// @author      -
// @include        http://*
// @include        https://*
// @license             MIT License
// @run-at              document-idle
// ==/UserScript==

//width: 695px; height: 391px; left: 0px; top: 0px;
$("body").append ( `
<canvas id="myCanvas"  style=" z-index:100; position: absolute";></canvas>
` );

$(document).ready(function() {

var v = document.getElementsByTagName("video")[0];
var c = document.getElementById("myCanvas");
var ctx = c.getContext('2d');
ctx.imageSmoothingEnabled = true;
var posvar = v.getBoundingClientRect();
c.style.left = posvar.left+'px';
c.style.top = posvar.top+'px';  
//c.style.top = v.style.top;
//c.style.left = v.style.top;  
  

var i;
  
//c.width  = v.width;
//c.height = v.height; 
let div = v.parentElement
div = v.parentElement
div.style.backgroundColor = "black" // Patch for ACFun.
c.style.width = '100%';
c.style.height = '100%';
c.width  = v.offsetWidth;
c.height = v.offsetHeight; 

v.addEventListener('play',function() {
  c.style.visibility = "visible";
  width  = c.width;
  height = c.height;
  i=window.setInterval(function() {
  //ctx.drawImage(v , 0,0)
    ctx.drawImage(v, 0, 0, width, height);
  var frame = ctx.getImageData(0, 0, width, height);
  var l = frame.data.length / 4;

  for (var i = 0; i < l; i++) {
    var grey = (frame.data[i * 4 + 0] + frame.data[i * 4 + 1] + frame.data[i * 4 + 2]) / 3;

    frame.data[i * 4 + 0] = grey;
    frame.data[i * 4 + 1] = grey;
    frame.data[i * 4 + 2] = grey;
  }
  ctx.putImageData(frame, 0, 0);

},0);
                                      
},false);
v.addEventListener('pause',function() {
  window.clearInterval(i);
  c.style.visibility = "hidden";
},false);
v.addEventListener('ended',function() {
  clearInterval(i);
  
},false);

});
