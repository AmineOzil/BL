import { ClassDeclaration, MethodDeclaration, Project } from "ts-morph";

export class Test{
    project = new Project();
        //a simple log statement to confirm that the project is correctly loaded
        // console.log(project); 
    injectLPS(lps:LPS){
        switch (lps.granularityType){
           case "method": var methodSignature=lps.granularityId.split(";")[0];
                          var className=lps.granularityId.split(";")[1];
                          var position=lps.position;
                          this.traceMethod(methodSignature,className,position);
                          break;
           case "basic block":var methodSignature=lps.granularityId.split(";")[0];
                              var className=lps.granularityId.split(";")[1];
                              var positionNumber=parseInt(lps.granularityId.split(";")[2]);
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
            var linenumber=method.getStatements()[0].getStartLineNumber();
            method.insertStatements(0,"console.log(Date.now()+\": "+method.getName()+" is called from WebRequest: "+className+" on line number:"+linenumber+"\");");
        }
        if(tracingPosition==="end"||!tracingPosition){
            if((method.getStatements()[method.getStatements().length-1]).getText().includes('return')) {
                         var linenumber=method.getStatements()[method.getStatements().length-1].getStartLineNumber();
                         method.insertStatements(method.getStatements().length-1,"console.log(Date.now()+\" "+method.getName()+" has been called from WebRequest: "+className+" on line number:"+linenumber+"\");");
            }
            else{
                var linenumber=method.getStatements()[method.getStatements().length-1].getEndLineNumber()+1;
                method.addStatements("console.log(Date.now()+\" "+method.getName()+" has been called from WebRequest: "+className+" on line number:"+linenumber+"\");")
            } 
        }
    }

    traceWebRequest(webRequestName:string){
        var classe=this.getClassByName(webRequestName);
        var constructors=classe.getConstructors();
        if(constructors.length==0)
            classe.insertConstructor(0, {statements: "console.log(Date.now()+\"The class (Web request):"+webRequestName+" has been called\");",});
        else constructors.forEach(constructor=>{
            constructor.insertStatements(0,"console.log(Date.now()+\"The class (Web request):"+webRequestName+" has been called\");");
        });

    }

    traceCodeBlock(methodDeclaration:string,className:string,position:number,where?:string){
        var classe=this.getClassByName(className);
        var method=this.getMethodBySignature(methodDeclaration,classe);
        var lineNumber=method.getStatements()[position].getStartLineNumber();
        if(where == "after") {            
            lineNumber=method.getStatements()[position].getEndLineNumber()+1;
            position = position+1;
        }
        var whatToLog="console.log(Date.now()+\" We are in file:"+classe.getSourceFile().getBaseName()+", class:"+className+", method:"+methodDeclaration+", and line number:"+lineNumber+"\");"
        method.insertStatements(position,whatToLog);

    }
    getMethodSignature(methodSourceCode:string):string{
        var methodDeclaration=methodSourceCode.split("{")[0];
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
        this.project.addSourceFilesAtPaths(["/home/depinfo/Bureau/JeuxDeMotsTesting/**/*{.js,.ts}","!/home/depinfo/Bureau/JeuxDeMotsTesting/node_modules","!/home/depinfo/Bureau/JeuxDeMotsTesting/**/*.*.js"]);
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
                           else console.log("Please enter a valid method id of format: {methodSignature()};{ClassName}");
                           break;
            case "web request":  if(this.checkClassName(granularityId)){
                                this.granularityId=granularityId;
                           }
                           else console.log("Please enter a valid class name.")
                           break;
            case "basic block": if(this.checkBasicBlockId(granularityId)){
                                    this.granularityId=granularityId;
                                }
                                else console.log("Please enter a valid basic block id of format: {methodSignature()};{ClassName};{positionNumberOfBasicBlockInMethod}");
                                break;
            
        }
     }
    checkClassName(className: string):boolean {
         var regex=/\w*/
         var result=new RegExp(regex,"g").test(className);
         return result;
    }
     checkMethodId(methodID:string):boolean{
         var regex=/[a-zA-Z][a-zA-Z]*\(([a-zA-Z]\w*:[a-zA-Z]\w*)?((,[a-zA-Z]\w*:[a-zA-Z]\w*)*)\)(:[a-zA-Z]\w*)?;\w*/; //this will only matches a string of format {methodSignature()};{className}
         var result=new RegExp(regex,"g").test(methodID);
         return result;
     }
     checkBasicBlockId(basicBlockId:string):boolean{
        var regex=/[a-zA-Z][a-zA-Z]*\(([a-zA-Z]\w*:[a-zA-Z]\w*)?((,[a-zA-Z]\w*:[a-zA-Z]\w*)*)\)(:[a-zA-Z]\w*)?;\w*;\d/; //this will only matches a string of format {methodSignature()};{className};{positionNumberOfBasicBlockInMethod}
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
var test=new Test();
test.initializeProject();
console.log("project initialized !")
const files=test.project.getSourceFiles();    
files.forEach((file)=>{
    //Log statement to print the names of all source files
    file.getClasses().forEach(element => {

      element.getMethods().forEach(method=>{
        test.traceMethod(test.getMethodSignature(method.getText()),element.getName());
      })
    })
    })

// test.traceMethod("methodWithParamsAndReturn(name:string,anotherParam:any):any","helloer","start");
test.project.saveSync();