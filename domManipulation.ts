import G = require("glob");
import { JSDOM } from "jsdom";
import { Project } from "ts-morph";
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';

const { PerformanceObserver, performance } = require('perf_hooks');
const parse5 = require('parse5');
const fs = require('fs');
const symbolicIDSeparator="__";
const project = new Project();
var doc: Document;
var files: any[] = [];
const glob = require('glob');
var t1 = performance.now();

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
var appFolder='';
rl.question('Please enter the path to your angular APP folder : \r\n', (path) => {
  appFolder=path;  
  t1 = performance.now();
  glob(appFolder + '/**/*.html', {}, (err, fileArray) => {
        files = fileArray;
        files.forEach(file => {
            var widgets:string[]=[];
            
            project.addSourceFileAtPath(file.replace(".html",".ts"));
            
            console.log(file);
            var html = fs.readFileSync(file,"utf-8");
            var co:string;
            var camelCaseRegex=/.[a-z]+[A-Z]+[a-z]*(?:[A-Z][a-z]+)*/gm;
            var camelCaseWords=html.match(camelCaseRegex);
            if (camelCaseWords){
            camelCaseWords=[...new Set(camelCaseWords)]; // To devare duplicates
            camelCaseWords.sort((a, b) => b.length - a.length); // Sort the words in order to make sure longer words get converted
            }
            
            html=html.replace(/%/g,'--pct--');
            //console.log(html);
            html = decodeURIComponent(html);
            html=html.replace(/--pct--/g,'%');
            html=html.replace(/\(click\)="/g,'(click)="trace($event);');
            html=html.replace(/\(ngSumbit\)="/g,'(ngSubmit)="trace($event);');
            // console.log(html);
            var dom = new JSDOM(html);
            doc = dom.window.document;
            var allElements = doc.getElementsByTagName("*");
            console.log(allElements.length);
            var allElementsArray = Array.from(allElements);
            var typing,trace:boolean=false;
            var elementsWithId = Array.from(doc.querySelectorAll("[id]"));
            allElementsArray.forEach((element) => {
  
                if ((element.getAttributeNames().includes("(click)") ||element.getAttributeNames().includes("[routerlink]") || element.getAttributeNames().includes("routerlink") || (element.getAttribute("href") && element.getAttribute("href") != "#") ) && !element.id) {
                    /*Symbolic id generation */
                    widgets.push(element.tagName);
                    var tagNameREGEX=new RegExp(element.tagName,'g');
                    const symbolicIDSeparator="__";
                    var symbolicID=element.tagName+symbolicIDSeparator+widgets.toString().match(tagNameREGEX).length;
                    

                    if(!element.getAttribute("(click)")){
                        element.setAttribute("click_event_added","trace($event)") //adding click event for routerlink elements
                    }
                    var id: string;
                    /* Generating id for widgets that misses ids */
                    id = getFirstTextValue(element);
                    if (element.tagName.includes("IMG")){
                        var filepath = element.getAttribute("src");
                        id = getFilename(filepath);
                    } 
                    else if (element.tagName.includes("EM")) id = generateIDforEM(element);
                    if (id == '') id= symbolicID;
                    else id=element.tagName+"_"+id+"_"+uuidv4();
                    console.log("id:" + id + " Tag:" + element.tagName);
                    element.id = id;
                    trace=true;
                    // element.setAttribute("\(click\)","trace($event);");
                }
                if(element.tagName=="input") {
                    element.id ="input_"+(element.getAttribute("name") || element.getAttribute("placeholder") || getFirstTextValue(element))+"_"+uuidv4();
                    if (element.id=="input_") element.id="input"+symbolicIDSeparator+widgets.toString().match(tagNameREGEX).length;
                    element.setAttribute("focusout_event_added","typing($event,\""+element.getAttribute("type")+"\")");
                    typing=true;
                }
                if(element.getAttribute("(click)") || element.getAttribute("click_event_added") || element.getAttribute("focusout_event_added") )
                element.setAttribute("data-eventful-widget","true");
            });
            var finalResult = doc.documentElement.outerHTML;
            finalResult=devareHtmlBodyTags(finalResult);

            if(camelCaseWords)
            camelCaseWords.forEach((word)=>{
                var escapeFirstvarter="";
                if(!isAlphaNumeric(word.charAt(0))) escapeFirstvarter="\\";
                var wordToLowercaseREGEX=new RegExp(escapeFirstvarter+word.toLowerCase(),'g');
                console.log("REGEX :"+wordToLowercaseREGEX);            
                finalResult=finalResult.replace(wordToLowercaseREGEX,word);
            });
            finalResult=finalResult.replace(/&amp;/gm,"&");
            finalResult=finalResult.replace(/&lt;/gm,"<");
            finalResult=finalResult.replace(/&gt;/gm,">");
            // finalResult=finalResult.replace(/&quot;/gm,"\"");
            finalResult=finalResult.replace(/click_event_added/gm,"(click)");
            finalResult=finalResult.replace(/focusout_event_added/gm,"(focusout)");
            // finalResult=finalResult.replace(/\*ngif/g,'*ngIf');
            // finalResult=finalResult.replace(/\*ngfor/g,'*ngFor');
            // finalResult=finalResult.replace(/ngmodelchange/g,'ngModelChange');
            // finalResult=finalResult.replace(/ngmodel/g,'ngModel');
            // finalResult=finalResult.replace(/showcustomrangelabel/g,'showCustomRangeLabel');
            // finalResult=finalResult.replace(/alwaysshowcalendars/g,'alwaysShowCalendars');
            // finalResult=finalResult.replace(/keepcalendaropeningwithrange/g,'keepCalendarOpeningWithRange');
            // finalResult=finalResult.replace(/autoapply/g,'autoApply');
            // finalResult=finalResult.replace(/#textinput/g,'#textInput');
            // finalResult=finalResult.replace(/ngxdaterangepickermd/g,'ngxDaterangepickerMd');
            // finalResult=finalResult.replace(/\[style.backgroundcolor\]/g,'[style.backgroundColor]');
            // finalResult=finalResult.replace(/\[innerhtml\]/g,'[innerHtml]');
            
            // finalResult=finalResult.replace(/ngstyle/g,'ngStyle');
            // finalResult=finalResult.replace(/ngclass/g,'ngClass');
            // finalResult=finalResult.replace(/#ckeditor/g,'#ckEditor');
            fs.writeFile(file, finalResult, err => {
                console.log('done');
            });
            project.getSourceFile(file.replace(".html",".ts")).getClasses().forEach(classe=>{
                    console.log(classe.getName())
                    var traceMethod ="trace(event:Event){\r\n                    let apiKey=\"de8a4390b3514c089e56c67413aee03f\";\r\n                    let ip=\"\";\r\n                    fetch('https://ipgeolocation.abstractapi.com/v1/?api_key=' + apiKey)\r\n                    // Extract JSON body content from HTTP response\r\n                   .then(response => response.json())\r\n                     // Do something with the JSON data\r\n                   .then(data => {\r\n                     ip=data.ip_address;\r\n                     const regex = /\\w+__\\d+/gm;\r\n                        var target = event.srcElement as HTMLElement;\r\n                        var idAttr = target.id;\r\n                        if(!idAttr || regex.exec(idAttr)){\r\n                          idAttr=this.getFirstTextValue(target);\r\n                        }\r\n                        console.info(\"Timestamp:\"+Date.now()+\" The user with ip:\"+ip+\" has clicked on widget : type :\"+target.tagName+\" id:\"+idAttr+\" XPath:\"+this.getXPath(target));\r\n                   });\r\n             }";
                    var getFirstTextValue="    getFirstTextValue(element:Element):string{\r\n        var i=0;\r\n        var text=\"\";\r\n        for(var elementhtml of Array.from(element.childNodes)){\r\n            text=elementhtml.textContent.replace(\/[\\n\\r]+|[\\s]{2,}\/g, \' \').trim();\r\n            if(text.length>0) break;\r\n        }\r\n        if(text==\"\" && element.parentElement) return this.getFirstTextValue(element.parentElement);\r\n        return text;\r\n    }";
                    var getXPath= "    getXPath(element:HTMLElement){\r\n      if (element.tagName.toLowerCase() == \'html\')\r\n      return \'\/HTML[1]\';\r\n      if (element===document.body)\r\n          return \'\/HTML[1]\/BODY[1]\';\r\n\r\n      var ix= 0;\r\n      var siblings= element.parentElement.children;\r\n      for (var i= 0; i<siblings.length; i++) {\r\n          var sibling= siblings[i];\r\n          if (sibling===element)\r\n              return this.getXPath(element.parentElement)+\'\/\'+element.tagName+\'[\'+(ix+1)+\']\';\r\n          if (sibling.nodeType===1 && sibling.tagName===element.tagName)\r\n              ix++;\r\n      }\r\n    }";
                    var typingMethod='typing(event:Event,type:string){\n'+
                    '    var target=event.target as HTMLInputElement;\n'+
                    '    if (type==\"password\") console.log(\"The user has typed a password on input:\"+target.id);\n'+
                    '    else console.log(\"The user has typed :\"+target.value+" on input:\"+target.id);\n'+
                    '  }';
                    if(trace){
                    classe.addMember(traceMethod); 
                    classe.addMember(getFirstTextValue);
                    classe.addMember(getXPath);
                    }
                    
                    if(typing)
                    classe.addMember(typingMethod);
                    console.log("method added");
                })
            project.saveSync();
        })
        var t2 = performance.now();
console.log("Execution time ="+(t2-t1)/1000+"s")
    })
    
  rl.close();
});

// project.getSourceFiles().forEach(sourceFile => {
//     console.log(sourceFile.getFilePath());
//     sourceFile.getClasses().forEach(classe=>{
//         console.log(classe.getName())
//         var traceMethod = '  trace(event:Event){\n    var target = event.srcElement as HTMLElement;\n    while(!target.id){\n      target=target.parentElement;\n    }\n    var idAttr = target.id;\n    console.log(\"The user has clicked on button :\"+idAttr);\n  }';
//         classe.addMember(traceMethod);
//         console.log("method added");
//     })
// });
// project.saveSync();

// generateIdForNGForElements(doc);


export function generateIdForNGForElements(doc: Document) {
    var allElements = doc.getElementsByTagName("*");
    console.log(allElements.length);
    var allElementsArray = Array.from(allElements);
    var elementsWithNgFor: Element[] = [];
    allElementsArray.forEach((element) => {
        if (element.getAttributeNames().includes("*ngfor")) {
            elementsWithNgFor.push(element);
        }
    });
    elementsWithNgFor.forEach((element) => {
        var firstNode = element.firstElementChild;
        firstNode.setAttribute("id", "\'" + firstNode.tagName + "_" + firstNode.textContent + "_" + "\'i");
        console.log(firstNode.id);
    });
}

export async function getAllHTMLFiles(folderPath: string, fileArray: any[]) {

}
export function getFirstValueFromElement(element: Element) {

}
export function getFilename(filepath: string): string {
    const regex = /.+\/*\/(.*)\..*$/gm;
    var match = regex.exec(filepath);
    return match[1];
}
export function generateIDforEM(element: Element): string {
    // var img = element.firstElementChild;
    // return generateIDforImageElement(img);
    if (!element.getAttributeNames().includes("(click)")) return "routerLink";
    return element.getAttribute("(click)").split(";")[1].split("(")[0];
}
export function devareHtmlBodyTags(html:string):string{
    var html2="";
    html2=html.replace('<html><head></head><body>','');
    html2=html2.replace('</body></html>','');
    return html2;
}
export function getFirstTextValue(element:Element):string{
    var i=0;
    var text="";
    for(var elementhtml of Array.from(element.childNodes)){
        text=elementhtml.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
        if(text.length>0) break;
    }
    // if(text=="" && element.parentElement) return getFirstTextValue(element.parentElement);
    return text;
}
function isAlphaNumeric(str) {
    var code, i, len;
  
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
  };