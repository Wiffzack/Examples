// ==UserScript==
// @name           Autofill eBay Maximum Bid
// @namespace      http://sopoforic.wordpress.com/
// @description    Automatically fills in the maximum bid box with the minimum possible bid.
// @version        0.4.2
// @copyright      2010+, Tracy Poff (http://sopoforic.wordpress.com/)
// @license        GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @include        *.ebay.tld/*
// ==/UserScript==

function adapt(){
  try{
    test = document.getElementsByClassName("x-additional-info")[0].innerText;
    newbet = parseFloat(test.replace(",",".").replace(/[^0-9&.]/g,''))+2 ;
    document.getElementsByName("maxbid")[0].value=newbet;
    if(document.getElementsByClassName("x-price-primary")[0]){
      document.getElementsByClassName("button-placebid")[0].click();
    }
  }catch(err){
    alert(err);
  }
}

function prepare(){
    try{
    price = document.getElementsByClassName("x-price-primary")[0];
    adapt();
    price.addEventListener("change", adapt());
    }catch(err){
    alert(err);
  }
}

//document.getElementsByClassName("button-placebid")[0].click();

document.addEventListener('DOMContentLoaded',prepare());
