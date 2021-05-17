import { EMLINK } from "constants";
import { JSDOM } from "jsdom";
import { Project } from "ts-morph";
import { v4 as uuidv4 } from 'uuid';
const fs = require('fs');
const project = new Project();
const ngHtmlParser = require('angular-html-parser');
let doc: Document;
let files: any[] = [];
const glob = require('glob');
glob("D:\\Users\\mohammed-amin.bouali\\Downloads\\MS_frontend_html\\src\\app\\components\\persons\\card-person\\card-person.component.html", {}, (err, fileArray) => {
    files = fileArray;
    files.forEach(file => {

        let html = fs.readFileSync(file,"utf-8");
        html=html.replace(/%/g,'--pct--');
        html = decodeURIComponent(html);
        html=html.replace(/--pct--/g,'%');
        // console.log(html);
        console.log("---------------------------------------");
        var dom = new JSDOM(html);
        doc = dom.window.document;
        var finalResult = doc.documentElement.outerHTML;
        // console.log(finalResult);
        let allElements = Array.from(doc.getElementsByClassName("edit-btn"));
        // console.log(allElements[3].firstChild.nodeValue)
        
        console.log(allElements[0].innerHTML);
        console.log(getFirstTextValue(allElements[0]));
        // var i=0;
        // let text="";
        // for(let element of Array.from(allElements[5].childNodes)){
        //     text=element.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
        //     console.log(text)
        //     if(text.length>0) break;
        // }
        // console.log(text);

                        // while(textChild.nodeType != textChild.TEXT_NODE || textChild.textContent.trim()==""){
        //     i++;
        //     console.log(i);
        //     textChild=allElements[3].childNodes[i];
        // }
        // let text=textChild.textContent;
        // console.log(text);
        finalResult=deleteHtmlBodyTags(finalResult);
        let array: string[]=["a","bbbd","bbbd","c","<cool","aslml","ss"];
        console.info(array.length);
        console.info(array)
        array=[...new Set(array)];
        console.info(array.length);
        console.info(array)
        array.sort((a, b) => b.length - a.length)
        array=array.filter((element)=> !element.startsWith("<"));
        console.info(array);
        console.info(" toolKit".toLowerCase());
        // fs.writeFile(file, finalResult, err => {
        //     console.log('done');
        // });
    })
})

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
        text=elementhtml.textContent.replace(/[\n\r]+|[\s]{2,}/g, "").trim();
        if(text.length>0) break;
    }
    if(text=="" && element.parentElement){
        console.log("I'm calling parent");
        text= getFirstTextValue(element.parentElement);
    } 
    return text;
}