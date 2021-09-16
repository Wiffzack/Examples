// ==UserScript==
// @name        Canvas Copy
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
<canvas id="myCanvas"  style="z-index:100; position: absolute";></canvas>
` );


$(document).ready(function() {

var v = document.getElementsByTagName("video")[0];
var c = document.getElementById("myCanvas");
var ctx = c.getContext('2d');
var i;

v.addEventListener('play',function() {i=window.setInterval(function() {
  ctx.drawImage(v , 0,0)
c.style.visibility = "visible";
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
