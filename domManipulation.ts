import { EMLINK } from "constants";
import G = require("glob");
import { JSDOM } from "jsdom";
import { Project } from "ts-morph";
import { v4 as uuidv4 } from 'uuid';
const parse5 = require('parse5');
const fs = require('fs');
const project = new Project();
let doc: Document;
let files: any[] = [];
const glob = require('glob');
glob("D:\\Users\\mohammed-amin.bouali\\Downloads\\Angular-ShoppingCart-master\\src\\app" + '/**/*.html', {}, (err, fileArray) => {
    files = fileArray;
    files.forEach(file => {
        // const widgets:string[]={};
        
        project.addSourceFileAtPath(file.replace(".html",".ts"));
        
        console.log(file);
        let html = fs.readFileSync(file,"utf-8");
        var co:string;
        var camelCaseRegex=/.[a-z]+[A-Z]+[a-z]*(?:[A-Z][a-z]+)*/gm;
        let camelCaseWords=html.match(camelCaseRegex);
        if (camelCaseWords){
           camelCaseWords=[...new Set(camelCaseWords)]; // To delete duplicates
           camelCaseWords.sort((a, b) => b.length - a.length); // Sort the words in order to make sure longer words get converted
           console.log(camelCaseWords.length); 
        }
        
        html=html.replace(/%/g,'--pct--');
        //console.log(html);
        html = decodeURIComponent(html);
        html=html.replace(/--pct--/g,'%');
        html=html.replace(/\(click\)="/g,'(click)="trace($event);');
        // console.log(html);
        var dom = new JSDOM(html);
        doc = dom.window.document;
        let allElements = doc.getElementsByTagName("*");
        console.log(allElements.length);
        let allElementsArray = Array.from(allElements);
        let typing,trace:boolean=false;
        let elementsWithId = Array.from(doc.querySelectorAll("[id]"));
        allElementsArray.forEach((element) => {
            console.log(element.getAttributeNames().includes("[routerlink]"));
            
            if ((element.getAttributeNames().includes("(click)") ||element.getAttributeNames().includes("[routerlink]") || (element.getAttribute("href") && element.getAttribute("href") != "#")  ) && !element.id) {
               
                /*TODO*/
                // widgets.push(element.tagName);
                // let tagNameREGEX=new RegExp(element.tagName,'g');
                // element.id=element.tagName+"__"+widgets.toString().match(tagNameREGEX).length;
               
                if(!element.getAttribute("(click)")){
                    element.setAttribute("click_event_added","trace($event)") //adding click event for routerlink elements
                }
                var id: string;

                id = getFirstTextValue(element);
                if (element.tagName.includes("IMG")){
                    let filepath = element.getAttribute("src");
                    id = getFilename(filepath);
                } 
                else if (element.tagName.includes("EM")) id = generateIDforEM(element);
                if (id != '') id= element.tagName +"_" +id;
                console.log("id:" + id + " Tag:" + element.tagName);
                element.id = id;
                trace=true;
                // element.setAttribute("\(click\)","trace($event);");
            }
            if(element.tagName=="input") {
                element.setAttribute("focusout_event_added","typing($event,\""+element.getAttribute("type")+"\")");
                typing=true;
            }
        });
        var finalResult = doc.documentElement.outerHTML;
        finalResult=deleteHtmlBodyTags(finalResult);

        if(camelCaseWords)
        camelCaseWords.forEach((word)=>{
            let escapeFirstLetter="";
            if(!isAlphaNumeric(word.charAt(0))) escapeFirstLetter="\\";
            let wordToLowercaseREGEX=new RegExp(escapeFirstLetter+word.toLowerCase(),'g');
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
                var traceMethod ="     trace(event:Event){\r\n        var target = event.srcElement as HTMLElement;\r\n        if(!target.id || target.id==\"\"){\r\n          target.id=this.getFirstTextValue(event.srcElement as HTMLElement);\r\n        }\r\n        var idAttr = target.id;\r\n        console.info(\"The user: has clicked on :\"+idAttr+\" XPath:\"+this.getXPath(target));\r\n    }";
                var getFirstTextValue="    getFirstTextValue(element:Element):string{\r\n        var i=0;\r\n        let text=\"\";\r\n        for(let elementhtml of Array.from(element.childNodes)){\r\n            text=elementhtml.textContent.replace(\/[\\n\\r]+|[\\s]{2,}\/g, \' \').trim();\r\n            if(text.length>0) break;\r\n        }\r\n        if(text==\"\" && element.parentElement) return this.getFirstTextValue(element.parentElement);\r\n        return text;\r\n    }";
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
})
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
    let allElements = doc.getElementsByTagName("*");
    console.log(allElements.length);
    let allElementsArray = Array.from(allElements);
    let elementsWithNgFor: Element[] = [];
    allElementsArray.forEach((element) => {
        if (element.getAttributeNames().includes("*ngfor")) {
            elementsWithNgFor.push(element);
        }
    });
    elementsWithNgFor.forEach((element) => {
        let firstNode = element.firstElementChild;
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
export function deleteHtmlBodyTags(html:string):string{
    var html2="";
    html2=html.replace('<html><head></head><body>','');
    html2=html2.replace('</body></html>','');
    return html2;
}
export function getFirstTextValue(element:Element):string{
    var i=0;
    let text="";
    for(let elementhtml of Array.from(element.childNodes)){
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