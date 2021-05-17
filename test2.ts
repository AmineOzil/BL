import { doesNotMatch } from "assert";
import { ClassDeclaration, ConstructorDeclaration, MethodDeclaration, Project } from "ts-morph";

export class Test{
    project = new Project();
        //a simple log statement to confirm that the project is correctly loaded
        // console.log(project); 
    injectLPS(lps:LPS){
        switch (lps.granularityType){
           case "method": var methodSignature=lps.granularityId.split("#")[0];
                          var className=lps.granularityId.split("#")[1];
                          var position=lps.position;
                          this.traceMethod(methodSignature,className,position);
                          break;
           case "basic block":var methodSignature=lps.granularityId.split("#")[0];
                              var className=lps.granularityId.split("#")[1];
                              var positionNumber=parseInt(lps.granularityId.split("#")[2]);
                              this.traceCodeBlock(methodSignature,className,positionNumber,lps.position);
                              break;
           case "web request":var className=lps.granularityId;
                              this.traceWebRequest(className);
                              break;
                            } 
        
        
    }  
    traceMethod(methodSignature:string,className:string,tracingPosition?:string){
        var classe=this.getClassByName(className);
        if(classe===undefined) {
            console.log(className+" class doesn't exist in the current project");
            return
        }
        var method=this.getMethodBySignature(methodSignature,classe);
        if(method===undefined){ 
            console.log(methodSignature+" method doesn't exist in class: "+className);
            return
        }
        if(tracingPosition==="start"||!tracingPosition){
            var linenumber=method.getStartLineNumber()+1;
            method.insertStatements(0,"console.log(Date.now()+\": Method: "+methodSignature+"#"+className+" on line number:"+linenumber+"\");");
        }
        if(tracingPosition==="end"){
            if((method.getStatements()[method.getStatements().length-1]).getText().includes('return')) {
                         var linenumber=method.getStatements()[method.getStatements().length-1].getStartLineNumber();
                         method.insertStatements(method.getStatements().length-1,"console.log(Date.now()+\": Method: "+methodSignature+"#"+className+" on line number:"+linenumber+"\");");
            }
            else{
                var linenumber=method.getStatements()[method.getStatements().length-1].getEndLineNumber()+1;
                method.addStatements("console.log(Date.now()+\": Method: "+methodSignature+"#"+className+" on line number:"+linenumber+"\");")
            } 
        }
    }

    traceWebRequest(webRequestName:string){
        var classe=this.getClassByName(webRequestName);
        var constructors=classe.getConstructors();
        if(constructors.length==0)
            classe.insertConstructor(0, {statements: "console.log(Date.now()+\": WebRequest: "+webRequestName+" has been called\");",});
        else constructors.forEach(constructor=>{
            constructor.insertStatements(0,"console.log(Date.now()+\": WebRequest: "+webRequestName+" has been called\");");
        });

    }

    traceCodeBlock(methodSignature:string,className:string,position:number,where?:string){
        var classe=this.getClassByName(className);
        var method=this.getMethodBySignature(methodSignature,classe);
        var lineNumber=method.getStatements()[position].getStartLineNumber();
        console.log("Statement"+method.getStatements()[position].getText()+" Method number of statements:"+method.getStatements().length);
        if(where == "after") {            
            lineNumber=method.getStatements()[position].getEndLineNumber()+1;
            position = position+1;
        }
        
        var whatToLog="console.log(Date.now()+\": BasicBlock: "+methodSignature+"#"+className+"#"+position+" FileName: "+classe.getSourceFile().getBaseName()+" LineNumber:"+lineNumber+"\");"
        method.insertStatements(position,whatToLog);

    }
    getMethodSignature(methodSourceCode:string):string{
        var methodDeclaration=methodSourceCode.split(")")[0]+")";
        if(methodSourceCode.startsWith("@")) {
            methodDeclaration=methodSourceCode.split(")")[1].trim()+")";
            console.log("TRUEE\n"+methodDeclaration);
        }
        return methodDeclaration;
    }

    getMethodBySignature(methodDeclaration:string,classe:ClassDeclaration):MethodDeclaration{
        var methodD;
        classe.getMethods().forEach(method=>{
            if(this.getMethodSignature(method.getText())===methodDeclaration){
                methodD=method;
            }
        })
        return methodD;

    }
    getClassByName(className:string):ClassDeclaration{
        var classeD;
        this.project.getSourceFiles().forEach(file=>
            file.getClasses().forEach(classe=>{
                if (classe.getName()==className){
                classeD=classe;}
            })
            );
        return classeD;
    }
    initializeProject(){
        this.project.addSourceFilesAtPaths(["D:\\Users\\mohammed-amin.bouali\\Downloads\\MS_frontend\\**\\*{.js,.ts}","!D:\\Users\\mohammed-amin.bouali\\Downloads\\MS_frontend\\node_modules","!D:\\Users\\mohammed-amin.bouali\\Downloads\\MS_frontend\\**\\*.*.js"]);
    }
    traceAllWebRequests(){
        const files=this.project.getSourceFiles();    
        files.forEach((file)=>{
            if(file.getClasses().length>1) {
                file.getClasses().forEach((classe)=>{
                    this.traceWebRequest(classe.getName());
                })
            }             
        })
    }
    testing(a:number,b:number){
        console.log("total is:"+(a+b));
    }
    traceAllMethods(className:string){
        var classe=this.getClassByName(className);
        if(classe===undefined) {
            console.log(className+" class doesn't exist in the current project");
            return
        }
        //If the class has some methods on it we trace all of these methods
        //if(classe.getMethods().length>0){
          classe.getMethods().forEach((method)=>{
            var methodSignature=this.getMethodSignature(method.getText());
            this.traceMethod(methodSignature,classe.getName(),"start");
        })  
        //If the class doesn't have any methods we trace all of its constructors 
       // }else{
            var constructors=classe.getConstructors();
            if(constructors.length==0)
                classe.insertConstructor(0, {statements: "console.log(Date.now()+\": Method: constructor()"+"#"+className+"\");"});
            else constructors.forEach(constructor=>{
                var constructorSignature=this.getMethodSignature(constructor.getText());
                constructor.insertStatements(0,"console.log(Date.now()+\": Method: "+constructorSignature+"#"+className+"\");");
            });
        //}
        
    }
    traceAllBasicBlocks(methodSignature:string,className:string){
        let classe=this.getClassByName(className);
        let method;
        if(methodSignature.includes("constructor")) 
            method=this.getConstructorBySignature(methodSignature,classe);
        else
            method=this.getMethodBySignature(methodSignature,classe);
        let numberOfBasicBlocks=method.getStatements().length;
        for(let i=0;i<numberOfBasicBlocks*2;i+=2){
          this.traceCodeBlock(methodSignature,className,i);  
        }
        
    }
    getConstructorBySignature(constructorSignature:string,classe:ClassDeclaration):ConstructorDeclaration{
        var construct;
        classe.getConstructors().forEach(constructor=>{
            if(this.getMethodSignature(constructor.getText())===constructorSignature){
                construct=constructor;
            }
        })
        return construct;

    }

}
export class LPS{
     granularityType:string;
     granularityId:string;
     position?:string;
     
     constructor(granularityType:string,granularityId:string,position?:string){
        this.checkGranularityType(granularityType);
        this.checkGranularityId(granularityId,granularityType);
        if(position) this.checkPosition(position,granularityType);
     }

     checkGranularityType(granularity_type:string){
         if (["web request","basic block","method","function"].includes(granularity_type)){
             this.granularityType = granularity_type;
         }
         else console.log("Please enter a valid granularity type (web request,basic block,method,function)")
     }
     checkGranularityId(granularityId:string,granularityType:string){
        switch (granularityType){
            case "method": if(this.checkMethodId(granularityId)){
                                this.granularityId=granularityId;
                           }
                           else console.log("Please enter a valid method id of format: {methodSignature()}#{ClassName}");
                           break;
            case "web request":  if(this.checkClassName(granularityId)){
                                this.granularityId=granularityId;
                           }
                           else console.log("Please enter a valid class name.")
                           break;
            case "basic block": if(this.checkBasicBlockId(granularityId)){
                                    this.granularityId=granularityId;
                                }
                                else console.log("Please enter a valid basic block id of format: {methodSignature()}#{ClassName}#{positionNumberOfBasicBlockInMethod}");
                                break;
            
        }
     }
    checkClassName(className: string):boolean {
         var regex=/\w*/
         var result=new RegExp(regex,"g").test(className);
         return result;
    }
     checkMethodId(methodID:string):boolean{
         var regex=/[a-zA-Z][a-zA-Z]*\(([a-zA-Z]\w*:[a-zA-Z]\w*)?((,[a-zA-Z]\w*:[a-zA-Z]\w*)*)\)(:[a-zA-Z]\w*)?#\w*/; //this will only matches a string of format {methodSignature()};{className}
         var result=new RegExp(regex,"g").test(methodID);
         return result;
     }
     checkBasicBlockId(basicBlockId:string):boolean{
        var regex=/[a-zA-Z][a-zA-Z]*\(([a-zA-Z]\w*:[a-zA-Z]\w*)?((,[a-zA-Z]\w*:[a-zA-Z]\w*)*)\)(:[a-zA-Z]\w*)?#\w*#\d/; //this will only matches a string of format {methodSignature()};{className};{positionNumberOfBasicBlockInMethod}
        var result=new RegExp(regex,"g").test(basicBlockId);
        return result;
     }
    //TODO: check function id {functionSignature()};{fileName}.{ts||js}
     checkFunctionId(){

     }
     checkPosition(position:string,granularity_type:string){
         var result = false;
        if(granularity_type == "method" || granularity_type == "fucntion"){
            if(position == "start" || position == "end") this.position=position;
            else console.log("Please enter a valid position for method/function. (start or end)");
        }
        else if(granularity_type == "basic block"){
            if(position == "before" || position == "after") this.position=position;
            else console.log("Please enter a valid position for basic block. (before or after)")
        }
     }
}
export function traceAllBasicBlocks(){
    var test=new Test();
test.initializeProject();
console.log("project initialized !")
const fs = require('fs');
let lps:LPS[]=[];
let data=fs.readFileSync("C:\\Users\\mohammed-amin.bouali\\eclipse-workspace\\maven.1614762316162\\ProjectManager\\testing_environement\\logs\\methods\\lps10.json");
lps = JSON.parse(data.toString());
lps.forEach(lps=>{
    let methodSignature=lps.granularityId.split("#")[0];
    let className=lps.granularityId.split("#")[1];
    console.log(methodSignature);
    test.traceAllBasicBlocks(methodSignature,className);
})
test.project.saveSync();

console.log("Logs injected !")
}

export function traceAllMethods(){
    var test=new Test();
test.initializeProject();
console.log("project initialized !")
const fs = require('fs');
let lps:LPS[]=[];
let data=fs.readFileSync("C:\\Users\\mohammed-amin.bouali\\eclipse-workspace\\maven.1614762316162\\ProjectManager\\testing_environement\\logs\\wrs\\lps10.json");
lps = JSON.parse(data.toString());
lps.forEach(lps=>{
    let className=lps.granularityId;
    test.traceAllMethods(className);
})
test.project.saveSync();

console.log("Logs injected !")
}

export function injectLPS(){
    var test=new Test();
    test.initializeProject();
    console.log("project initialized !")
    const fs = require('fs');
    let lpses:LPS[]=[];
    let data=fs.readFileSync("C:\\Users\\mohammed-amin.bouali\\eclipse-workspace\\maven.1614762316162\\ProjectManager\\testing_environement\\logs\\bbs\\lps10.json");
    lpses = JSON.parse(data.toString());
    lpses.forEach(lps=>{
        test.injectLPS(lps);
    })
    test.project.saveSync();
    
    console.log("Logs injected !")
}
// test.traceMethod("methodWithParamsAndReturn(name:string,anotherParam:any):any","helloer","start");
injectLPS();