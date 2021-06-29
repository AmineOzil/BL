import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import glob = require('glob');

import { JSDOM } from "jsdom";
import { Project } from "ts-morph";
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';
import { performance } from 'perf_hooks';

const symbolicIDSeparator="__";
const project = new Project();

/**
 * app's folder absolute path
 */
let appFolder='';

/**
 * a folder in which the app/ folder of the project will be copied
 * for now it's hardcoded, but should be chosen by the client/developer
 */
const testFolder = 'D:\\coding\\angular\\test';

main();

function main() {
    let t1 = performance.now();
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    
    rl.question('Please enter the absolute path to your Angular app/ folder : \r\n', (appPath) => {
      setAppFolder(appPath);
    
      t1 = performance.now();
      glob(appFolder + '/**/*.html', {}, (err, files) => {
            files.forEach(file => {
                let componentTemplateWrapper = new ComponentTemplateWrapper(project, file);
                componentTemplateWrapper.instrument();
                componentTemplateWrapper.businessLogic.instrument();
            });
            let t2 = performance.now();
            console.log(`Execution time = ${(t2-t1)/1000}s`);
        });
        
      rl.close();
    }); 
}

function setAppFolder(appPath: string, mode: 'in_place' | 'test' = 'in_place') {
    if (mode === 'in_place')
        appFolder = appPath;
    else {
        let projectName = path.basename(path.dirname(path.dirname(appPath)));
        appFolder = `${testFolder}\\${projectName}\\src\\app`;
        fse.copySync(appPath, appFolder);
    }
}

function isAlphaNumeric(str: string) {
    for (let i = 0, len = str.length; i < len; i++) {
      let code = str.charCodeAt(i);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
}

export class CodeInjector {
    
    static getTraceMethodImpl() {
        return `
        trace(event:Event){
            let apiKey="de8a4390b3514c089e56c67413aee03f";
            let ip="";
            fetch('https://ipgeolocation.abstractapi.com/v1/?api_key=' + apiKey)
            // Extract JSON body content from HTTP response
            .then(response => response.json())
            // Do something with the JSON data
            .then(data => {
                ip=data.ip_address;
                const regex = /\w+__\d+/gm;
                var target = event.target as HTMLElement;
                var idAttr = target.id;
                if(!idAttr || regex.exec(idAttr))
                    idAttr=this.getFirstTextValue(target);
                console.info("Timestamp: "+Date.now()+", User IP: "+ip+", Event: 'Click', Widget: (Type:"+target.tagName+", ID:"+idAttr+", XPath:"+this.getXPath(target)+")");
            });
        }`;
    }

    static getFirstTextValueImpl() {
        return `
        getFirstTextValue(element:Element):string{
            var i=0;
            var text="";
            for(var elementhtml of Array.from(element.childNodes)){
                text=elementhtml.textContent.replace(/[\\n\\r]+|[\\s]{2,}/g, ' ').trim();
                if(text.length>0) break;
            }
            if(text=="" && element.parentElement)
                return this.getFirstTextValue(element.parentElement);
            return text;
        }`;
    }

    /**
     * @TODO Bug: an error occurs when element.parentElement is null when computing siblings
     */
    static getXPathImpl() {
        return `
        getXPath(element:HTMLElement){
            if (element.tagName.toLowerCase() == 'html')
                return '/HTML[1]';
            if (element===document.body)
                return '/HTML[1]/BODY[1]';
    
            let ix = 0;
            let siblings = element.parentElement.children;
            for (let i = 0; i < siblings.length; i++) {
                let sibling = siblings[i];
                if (sibling === element)
                    return this.getXPath(element.parentElement)+'/'+element.tagName+'['+(ix+1)+']';
                if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                    ix++;
            }
        }`;
    }

    static getTypingMethodImpl() {
        return `
        typing(event:Event,type:string){
            var target=event.target as HTMLInputElement;
            if (type=="password")
                console.log("The user has typed a password on input:"+target.id);
            else 
                console.log("The user has typed :"+target.value+" on input:"+target.id);
          }`;
    }
}

export class ComponentTemplateWrapper {

    private _html: string;
    private _document: Document;
    private _widgets: string[] = [];
    private _tracing = false;
    private _typing = false;
    private readonly camelCaseRegex: RegExp = /.[a-z]+[A-Z]+[a-z]*(?:[A-Z][a-z]+)*/gm;
    private camelCaseWords: RegExpMatchArray;
    private _businessLogic: ComponentBusinessLogicWrapper;
    
    constructor(private _project: Project, private _file: string){
        this._html = fs.readFileSync(_file,"utf-8");
        this._businessLogic = new ComponentBusinessLogicWrapper(_project, this);
    }

    get project(){
        return this._project;
    }

    get file(){
        return this._file;
    }

    get html(){
        return this._html;
    }

    get document(){
        return this._document;
    }

    get widgets(){
        return this._widgets;
    }

    get tracing(){
        return this._tracing;
    }

    set tracing(value: boolean){
        this._tracing = value;
    }

    get typing(){
        return this._typing;
    }

    set typing(value: boolean){
        this._typing = value;
    }

    get businessLogic(){
        return this._businessLogic;
    }

    getCamelCaseAttributesAndValuesFromInitialHTML(){
        this.camelCaseWords = this._html.match(this.camelCaseRegex);
    
        if (this.camelCaseWords){
            // Delete duplicates
            this.camelCaseWords = [...new Set(this.camelCaseWords)];
            // Sort the words in order to make sure longer words get converted
            this.camelCaseWords.sort((a, b) => b.length - a.length);
        }
    }

    preprocessHTML(){
        this._html = this._html.replace(/%/g, '--pct--');
        this._html = decodeURIComponent(this._html);
        this._html = this._html.replace(/--pct--/g, '%');
        this._html = this._html.replace(/\(click\)="/g, '(click)="trace($event);');
        this._html = this._html.replace(/\(ngSubmit\)="/g, '(ngSubmit)="trace($event);');
    }

    parseDOM(){
        this._document = (new JSDOM(this._html)).window.document;
    }

    assignIDsToElements(){
        let allElements = Array.from(this._document.getElementsByTagName("*"));
            console.log(`# Elements: ${allElements.length}`);
            allElements.forEach((element) => {

                let elementWrapper = new ElementWrapper(element, this);
                let elementIDGenerator = new ElementIDGenerator(elementWrapper);
                elementIDGenerator.visit();
            });
    }

    deleteHtmlBodyTags(){
        let html2 = "";
        html2 = this._html.replace('<html><head></head><body>','');
        html2 = html2.replace('</body></html>','');
        this._html = html2;
    }
    
    replaceLowerCaseAttributesAndValuesByCamelCaseInFinalHTML(){
        if(this.camelCaseWords)
            this.camelCaseWords.forEach((word) => {
                let escapeFirstvarter="";
    
                if(!isAlphaNumeric(word.charAt(0))) 
                    escapeFirstvarter="\\";
                
                let wordToLowercaseREGEX = new RegExp(escapeFirstvarter + word.toLowerCase(), 'g');
                this._html = this._html.replace(wordToLowercaseREGEX, word);
            });
    }
    
    postProcessHTML(){
        this._html = this._document.documentElement.outerHTML;
        this.deleteHtmlBodyTags();
    
        /**
         * Replacing all captured angular attributes or values that 
         * have been turned into lowercase by the JSDOM parser
         * and replacing them by their original camelCase format
         * as it was stored earlier.
         */
        this.replaceLowerCaseAttributesAndValuesByCamelCaseInFinalHTML();
        this._html = this._html.replace(/&amp;/gm,"&");
        this._html = this._html.replace(/&lt;/gm,"<");
        this._html = this._html.replace(/&gt;/gm,">");
        this._html = this._html.replace(/click_event_added/gm,"(click)");
        this._html = this.html.replace(/focusout_event_added/gm,"(focusout)");
    }

    instrument(){
        console.log(`Started instrumenting ${this._file}`);
        this.getCamelCaseAttributesAndValuesFromInitialHTML();
        this.preprocessHTML();
        this.parseDOM();
        this.assignIDsToElements();
        this.postProcessHTML();
        fs.writeFile(this._file, this._html, err => {
            console.log(`Done instrumenting ${this._file}`);
        });
    }
}

export class ComponentBusinessLogicWrapper{

    private _file: string;

    constructor(private _project: Project, private _template: ComponentTemplateWrapper){
        this._file = this._template.file.replace(".html", ".ts");
    }

    get project(){
        return this._project;
    }

    get template(){
        return this._template;
    }

    get file(){
        return this._file;
    }

    instrument(){
        console.log(`Started instrumenting ${this._file}`);
        this._project.addSourceFileAtPath(this._file);
        this._project.getSourceFile(this._file).getClasses().forEach(cls => {
                console.log(`Class: ${cls.getName()}`);
                if(this._template.tracing)
                    cls.addMembers([
                        CodeInjector.getTraceMethodImpl(), 
                        CodeInjector.getFirstTextValueImpl(), 
                        CodeInjector.getXPathImpl()
                    ]);
                if(this._template.typing)
                    cls.addMember(CodeInjector.getTypingMethodImpl());
                console.log(`Done instrumenting ${this._file}`);
            });
        this._project.saveSync();
    }
}

export class ElementWrapper {
    private regex: RegExp;

    constructor(private _element: Element, private _containerTemplate: ComponentTemplateWrapper){
        this.regex = new RegExp(this._element.tagName,'g');
    }

    get element(){
        return this._element;
    }

    get containerTemplate(){
        return this._containerTemplate;
    }

    requiresTracing(): boolean {
        return !this._element.id && 
            (this._element.getAttributeNames().includes("(click)") ||
            this._element.getAttributeNames().includes("[routerlink]") || 
            this._element.getAttributeNames().includes("routerlink") || 
            (this._element.tagName === "BUTTON" 
                && this._element.getAttribute("type") === "submit") ||
            (this._element.getAttribute("href") 
                && this._element.getAttribute("href") != "#"))
    }

    generateSymbolicID(): string{
        return this._element.tagName+symbolicIDSeparator+this._containerTemplate.widgets.toString().match(this.regex).length;
    }

    hasEvent(event: string){
        return this._element.getAttribute(event);       
    }

    isEventful(){
        return this.hasEvent("(click)") || 
            this.hasEvent("click_event_added") ||
            this.hasEvent("focus_event_added");
    }

    setEventful(){
        this._element.setAttribute("data-eventful-widget","true");
    }

    accept(visitor: ElementIDGenerator){
        visitor.visit();
    }
}

export abstract class ElementVisitor {
    constructor(protected elementWrapper: ElementWrapper){}
    abstract visit(): void;
}

export class ElementIDGenerator extends ElementVisitor {
    constructor(elementWrapper: ElementWrapper){
        super(elementWrapper);
    }

    visit(): void {
        let id: string = "";

        if (this.elementWrapper.requiresTracing()){
            this.elementWrapper.containerTemplate.tracing = true;
            this.elementWrapper.containerTemplate.widgets.push(this.elementWrapper.element.tagName);

            if(!this.elementWrapper.element.getAttribute("(click)") 
                && this.elementWrapper.element.tagName !== "BUTTON"){
                    this.elementWrapper.element.setAttribute("click_event_added","trace($event)");
            }

            if (this.elementWrapper.element.tagName.toLowerCase() === "img"){
                id = this.generateIDForImage();
            }

            else if (this.elementWrapper.element.tagName.toLowerCase() === "em"){
                id = this.generateIDForEmphasis();
            }

            else {
                id = this.generateDefaultID(this.elementWrapper.element);
            }

            if (!id)
                id = this.elementWrapper.generateSymbolicID();
            else
                id = this.elementWrapper.element.tagName + "_" + id + "_" + uuidv4();

            this.elementWrapper.element.id = id;
        }

        if (this.elementWrapper.element.tagName.toLowerCase() === "input"){
            this.elementWrapper.containerTemplate.typing = true;

            this.elementWrapper.element.setAttribute("focusout_event_added",`typing($event,
                '${this.elementWrapper.element.getAttribute("type")}')`);

            id = this.generateIDForInput();

            this.elementWrapper.element.id = id;
        }

        console.log(`Element tag: ${this.elementWrapper.element.tagName}, Element id: ${this.elementWrapper.element.id}`);

        if (this.elementWrapper.isEventful())
            this.elementWrapper.setEventful();
    }

    private generateIDForImage(){
        const regex = /.+\/*\/(.*)\..*$/gm;
        let imagePath = this.elementWrapper.element.getAttribute("src");
        let match = regex.exec(imagePath);
        return match[1];
    }

    private generateIDForEmphasis(){
        if (!this.elementWrapper.element.getAttributeNames().includes("(click)")) 
            return "routerLink";
        return this.elementWrapper.element.getAttribute("(click)")
                                          .split(";")[1]
                                          .split("(")[0];
    }

    private generateDefaultID(element: Element){ // first text value
        let text = "";
        for (let htmlElement of Array.from(element.childNodes)){
            text = htmlElement.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
            
            if (text.length > 0) 
                break;
        }

        if (text == "" && element.parentElement)
            return this.generateDefaultID(element.parentElement);

        return text;
    }

    private generateIDForInput(){
        let primaryInputIDComponent = (this.elementWrapper.element.getAttribute("name") || 
            this.elementWrapper.element.getAttribute("placeholder") || 
            this.elementWrapper.element.getAttribute("formControlName") || 
            this.generateDefaultID(this.elementWrapper.element));

        if (primaryInputIDComponent)
            return this.elementWrapper.element.tagName + symbolicIDSeparator + primaryInputIDComponent + symbolicIDSeparator + uuidv4();
        else
            return this.elementWrapper.generateSymbolicID();
    }
}
