// ==UserScript==
// @name        Simple
// @namespace   Violentmonkey Scripts
// @grant       none
// @version     1.0
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js 
// @include        http://*
// @include        https://*
// @grant               none
// @license             MIT License
// @grant       GM_xmlhttpRequest
// @run-at              document-idle
// ==/UserScript==

// https://cdnjs.cloudflare.com/ajax/libs/blockadblock/3.2.1/blockadblock.min.js


//var str = document.getElementsByTagName('head')[0].innerHTML;
// das ziel ist einfach nur das das laden nicht erfolgt;
//var newstr = str.replace(/blockadblock.min.js"/i, "test");
//document.getElementsByTagName('head')[0].innerHTML = newstr;

let text =  document.getElementsByTagName('head')[0].innerHTML;
const toStrip = ['blockadblock','blockadblock', 'adblockDetector', 'fuckadblock','detect-adblock'];
toStrip.forEach(x => {
   text = text.replace(x, '');
});
document.getElementsByTagName('head')[0].innerHTML = text;



// funktioniert nicht !!! sollte eigentlich zu beginn geladen werden aber der rest
// der modifikationen findent nach dem laden statt
function addScript(text) {
    text = text.replace(/console.log("work!!!!");/g, "");
    var newScript = document.createElement('script');
    newScript.type = "text/javascript";
    newScript.textContent = text;
    var head = document.getElementsByTagName('head')[0];
    head.appendChild(newScript);
}

window.addEventListener('beforescriptexecute', function(e) {
    src = e.target.src;
    if (src.search(/blockadblock.min\.js/) != -1) {
        e.preventDefault();
        e.stopPropagation();        
        GM_xmlhttpRequest({
            method: "GET",
            url: e.target.src,
            onload: function(response) {
                addScript(response.responseText);
            }
        });
    }
});

////////////////////////////////////////////////

//rel="preload" as="video"
// ändert das preloaden von videos auf auto 
// das video soll vor der werbung laden 
function changepreload(){
  try{
      var videos = document.getElementsByTagName("video");
      for(var i=0,l=videos.length; i<l; i++) {
          videos[i].preload = "auto";
      }
      //var links = document.getElementsByTagName("link");
      //for(var i=0,l=links.length; i<l; i++) {
      //    links[i].rel = "preload";
      //    links[i].as = "video";
      //}    
    
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

// Angular js ng-click
// nocht nicht in verwendung 
// schließt automatisch fenster die mit angular erstellt wurden .
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

// entfernt addeventlistener von der seite 
// das killt ziemlich viele adblock detector zumindest theoretisch 
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

// doesnt solve background tricks
// Bsp der standart ladet einen blur effekt über den hintergrund 
// wird mit findHighestZIndex() gefixt
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

var win = window,
    doc = document,
    docElem = doc.documentElement,
    body = doc.getElementsByTagName('body')[0],
    x = win.innerWidth || docElem.clientWidth || body.clientWidth,
    y = win.innerHeight|| docElem.clientHeight|| body.clientHeight;
//alert(x + ' × ' + y);

var zelement;

function findHighestZIndex()
{
    var divs = document.getElementsByTagName('div');
    var highest = 0;
    for (var i = 0; i < divs .length; i++)
    {
        // fixed adblock meldung auf gutefrage
        if((divs[i].clientWidth  || divs[i].innerWidth ) === x || (divs[i].clientHeight || divs[i].innerHeight )  === y){
              console.log("element removed");
              divs[i].parentNode.removeChild(divs[i]);  
        }
        var zindex = divs[i].style.zIndex;
        if (zindex > highest) {
            zelement= divs[i];
            highest = zindex;
            divs[i].style.zIndex="0";
            divs[i].style.width = '1%';
            divs[i].style.height = '1%';
            
        }
    }
    //return highest;
}

function removediv()
{
    // annahme das div[0] die eigentliche seite ist
    var divs = document.getElementsByTagName('div');
    divs[1].parentNode.removeChild(divs[1]);
    //return highest;
}



// macht nix
function fullscreenblur(){
  try{
      var blur = document.getElementsByTagName("div");
      for(var i=0,l= blur.length; i<l; i++) {
            if(blur[i].style.height ==="1px"){
              //blur[i].width()="0%";
              console.log("found!!");
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

/// main

changepreload();
changeinput();

function clearit(){
  // hauptdomain oder sub 
  if(window.location.pathname.length > 1) {
    findHighestZIndex();  
    adblockwindows();
    findHighestZIndex();   
} else {
    findHighestZIndex();  
    adblockwindows();
    //findHighestZIndex();   
}

}

setTimeout(function() { 
  //modifybody();
  clearit()
}, 8000);

// wichtig da auf seiten änderungen  reagiert wird
// funtioniert glaub ich nicht in allen browsern
window.addEventListener("hashchange", clearit(), false);









