var ts_morph_1 = require("ts-morph");
var Test = (function () {
    function Test() {
        this.project = new ts_morph_1.Project();
    }
    //a simple log statement to confirm that the project is correctly loaded
    // console.log(project); 
    Test.prototype.injectLPS = function (lps) {
        switch (lps.granularityType) {
            case "method":
                var methodSignature = lps.granularityId.split("#")[0];
                var className = lps.granularityId.split("#")[1];
                var position = lps.position;
                this.traceMethod(methodSignature, className, position);
                break;
            case "basic block":
                var methodSignature = lps.granularityId.split("#")[0];
                var className = lps.granularityId.split("#")[1];
                var positionNumber = parseInt(lps.granularityId.split("#")[2]);
                this.traceCodeBlock(methodSignature, className, positionNumber, lps.position);
                break;
            case "web request":
                var className = lps.granularityId;
                this.traceWebRequest(className);
                break;
        }
    };
    Test.prototype.traceMethod = function (methodSignature, className, tracingPosition) {
        var classe = this.getClassByName(className);
        if (classe === undefined) {
            console.log(className + " class doesn't exist in the current project");
            return;
        }
        var method = this.getMethodBySignature(methodSignature, classe);
        if (method === undefined) {
            console.log(methodSignature + " method doesn't exist in class: " + className);
            return;
        }
        if (tracingPosition === "start" || !tracingPosition) {
            var linenumber = method.getStatements()[0].getStartLineNumber();
            method.insertStatements(0, "console.log(Date.now()+\": Method: " + methodSignature + "#" + className + " on line number:" + linenumber + "\");");
        }
        if (tracingPosition === "end" || !tracingPosition) {
            if ((method.getStatements()[method.getStatements().length - 1]).getText().includes('return')) {
                var linenumber = method.getStatements()[method.getStatements().length - 1].getStartLineNumber();
                method.insertStatements(method.getStatements().length - 1, "console.log(Date.now()+\": Method: " + methodSignature + "#" + className + " on line number:" + linenumber + "\");");
            }
            else {
                var linenumber = method.getStatements()[method.getStatements().length - 1].getEndLineNumber() + 1;
                method.addStatements("console.log(Date.now()+\": Method: " + methodSignature + "#" + className + " on line number:" + linenumber + "\");");
            }
        }
    };
    Test.prototype.traceWebRequest = function (webRequestName) {
        var classe = this.getClassByName(webRequestName);
        var constructors = classe.getConstructors();
        if (constructors.length == 0)
            classe.insertConstructor(0, { statements: "console.log(Date.now()+\": WebRequest: " + webRequestName + " has been called\");" });
        else
            constructors.forEach(function (constructor) {
                constructor.insertStatements(0, "console.log(Date.now()+\": WebRequest: " + webRequestName + " has been called\");");
            });
    };
    Test.prototype.traceCodeBlock = function (methodSignature, className, position, where) {
        var classe = this.getClassByName(className);
        var method = this.getMethodBySignature(methodSignature, classe);
        var lineNumber = method.getStatements()[position].getStartLineNumber();
        if (where == "after") {
            lineNumber = method.getStatements()[position].getEndLineNumber() + 1;
            position = position + 1;
        }
        var whatToLog = "console.log(Date.now()+\": BasicBlock: " + methodSignature + "#" + className + "#" + position + " FileName: " + classe.getSourceFile().getBaseName() + " LineNumber:" + lineNumber + "\");";
        method.insertStatements(position, whatToLog);
    };
    Test.prototype.getMethodSignature = function (methodSourceCode) {
        var methodDeclaration = methodSourceCode.split(")")[0] + ")";
        return methodDeclaration;
    };
    Test.prototype.getMethodBySignature = function (methodDeclaration, classe) {
        var _this = this;
        var methodD;
        classe.getMethods().forEach(function (method) {
            if (_this.getMethodSignature(method.getText()) === methodDeclaration) {
                methodD = method;
            }
        });
        return methodD;
    };
    Test.prototype.getClassByName = function (className) {
        var classeD;
        this.project.getSourceFiles().forEach(function (file) {
            return file.getClasses().forEach(function (classe) {
                if (classe.getName() == className) {
                    classeD = classe;
                }
            });
        });
        return classeD;
    };
    Test.prototype.initializeProject = function () {
        this.project.addSourceFilesAtPaths(["D:\\Users\\mohammed-amin.bouali\\Downloads\\MS_frontend\\**\\*{.js,.ts}", "!D:\\Users\\mohammed-amin.bouali\\Downloads\\MS_frontend\\node_modules", "!D:\\Users\\mohammed-amin.bouali\\Downloads\\MS_frontend\\**\\*.*.js"]);
    };
    Test.prototype.traceAllWebRequests = function () {
        var _this = this;
        var files = this.project.getSourceFiles();
        files.forEach(function (file) {
            if (file.getClasses().length > 1) {
                file.getClasses().forEach(function (classe) {
                    _this.traceWebRequest(classe.getName());
                });
            }
        });
    };
    Test.prototype.testing = function (a, b) {
        console.log("total is:" + (a + b));
    };
    Test.prototype.traceAllMethods = function (className) {
        var _this = this;
        var classe = this.getClassByName(className);
        if (classe === undefined) {
            console.log(className + " class doesn't exist in the current project");
            return;
        }
        //If the class has some methods on it we trace all of these methods
        //if(classe.getMethods().length>0){
        classe.getMethods().forEach(function (method) {
            var methodSignature = _this.getMethodSignature(method.getText());
            _this.traceMethod(methodSignature, classe.getName(), "start");
        });
        //If the class doesn't have any methods we trace all of its constructors 
        // }else{
        var constructors = classe.getConstructors();
        if (constructors.length == 0)
            classe.insertConstructor(0, { statements: "console.log(Date.now()+\": Method: constructor()" + "#" + className + "\");" });
        else
            constructors.forEach(function (constructor) {
                var constructorSignature = _this.getMethodSignature(constructor.getText());
                constructor.insertStatements(0, "console.log(Date.now()+\": Method: " + constructorSignature + "#" + className + "\");");
            });
        //}
    };
    Test.prototype.traceAllBasicBlocks = function (methodSignature, className) {
        var classe = this.getClassByName(className);
        var method;
        if (methodSignature.includes("constructor"))
            method = this.getConstructorBySignature(methodSignature, classe);
        else
            method = this.getMethodBySignature(methodSignature, classe);
        for (var i = 0; i < method.getStatements().length; i++) {
            this.traceCodeBlock(methodSignature, className, i);
        }
    };
    Test.prototype.getConstructorBySignature = function (constructorSignature, classe) {
        var _this = this;
        var construct;
        classe.getConstructors().forEach(function (constructor) {
            if (_this.getMethodSignature(constructor.getText()) === constructorSignature) {
                construct = constructor;
            }
        });
        return construct;
    };
    return Test;
})();
exports.Test = Test;
var LPS = (function () {
    function LPS(granularityType, granularityId, position) {
        this.checkGranularityType(granularityType);
        this.checkGranularityId(granularityId, granularityType);
        if (position)
            this.checkPosition(position, granularityType);
    }
    LPS.prototype.checkGranularityType = function (granularity_type) {
        if (["web request", "basic block", "method", "function"].includes(granularity_type)) {
            this.granularityType = granularity_type;
        }
        else
            console.log("Please enter a valid granularity type (web request,basic block,method,function)");
    };
    LPS.prototype.checkGranularityId = function (granularityId, granularityType) {
        switch (granularityType) {
            case "method":
                if (this.checkMethodId(granularityId)) {
                    this.granularityId = granularityId;
                }
                else
                    console.log("Please enter a valid method id of format: {methodSignature()}#{ClassName}");
                break;
            case "web request":
                if (this.checkClassName(granularityId)) {
                    this.granularityId = granularityId;
                }
                else
                    console.log("Please enter a valid class name.");
                break;
            case "basic block":
                if (this.checkBasicBlockId(granularityId)) {
                    this.granularityId = granularityId;
                }
                else
                    console.log("Please enter a valid basic block id of format: {methodSignature()}#{ClassName}#{positionNumberOfBasicBlockInMethod}");
                break;
        }
    };
    LPS.prototype.checkClassName = function (className) {
        var regex = /\w*/;
        var result = new RegExp(regex, "g").test(className);
        return result;
    };
    LPS.prototype.checkMethodId = function (methodID) {
        var regex = /[a-zA-Z][a-zA-Z]*\(([a-zA-Z]\w*:[a-zA-Z]\w*)?((,[a-zA-Z]\w*:[a-zA-Z]\w*)*)\)(:[a-zA-Z]\w*)?#\w*/; //this will only matches a string of format {methodSignature()};{className}
        var result = new RegExp(regex, "g").test(methodID);
        return result;
    };
    LPS.prototype.checkBasicBlockId = function (basicBlockId) {
        var regex = /[a-zA-Z][a-zA-Z]*\(([a-zA-Z]\w*:[a-zA-Z]\w*)?((,[a-zA-Z]\w*:[a-zA-Z]\w*)*)\)(:[a-zA-Z]\w*)?#\w*#\d/; //this will only matches a string of format {methodSignature()};{className};{positionNumberOfBasicBlockInMethod}
        var result = new RegExp(regex, "g").test(basicBlockId);
        return result;
    };
    //TODO: check function id {functionSignature()};{fileName}.{ts||js}
    LPS.prototype.checkFunctionId = function () {
    };
    LPS.prototype.checkPosition = function (position, granularity_type) {
        var result = false;
        if (granularity_type == "method" || granularity_type == "fucntion") {
            if (position == "start" || position == "end")
                this.position = position;
            else
                console.log("Please enter a valid position for method/function. (start or end)");
        }
        else if (granularity_type == "basic block") {
            if (position == "before" || position == "after")
                this.position = position;
            else
                console.log("Please enter a valid position for basic block. (before or after)");
        }
    };
    return LPS;
})();
exports.LPS = LPS;
function traceAllBasicBlocks() {
    var test = new Test();
    test.initializeProject();
    console.log("project initialized !");
    var fs = require('fs');
    var lps = [];
    var data = fs.readFileSync("C:\\Users\\mohammed-amin.bouali\\eclipse-workspace\\maven.1614762316162\\ProjectManager\\testing_environement\\logs\\methods\\lps8.json");
    lps = JSON.parse(data.toString());
    lps.forEach(function (lps) {
        var methodSignature = lps.granularityId.split("#")[0];
        var className = lps.granularityId.split("#")[1];
        test.traceAllBasicBlocks(methodSignature, className);
    });
    test.project.saveSync();
    console.log("Logs injected !");
}
exports.traceAllBasicBlocks = traceAllBasicBlocks;
function traceAllMethods() {
    var test = new Test();
    test.initializeProject();
    console.log("project initialized !");
    var fs = require('fs');
    var lps = [];
    var data = fs.readFileSync("C:\\Users\\mohammed-amin.bouali\\eclipse-workspace\\maven.1614762316162\\ProjectManager\\testing_environement\\logs\\wrs\\lps8.json");
    lps = JSON.parse(data.toString());
    lps.forEach(function (lps) {
        var className = lps.granularityId;
        test.traceAllMethods(className);
    });
    test.project.saveSync();
    console.log("Logs injected !");
}
exports.traceAllMethods = traceAllMethods;
// test.traceMethod("methodWithParamsAndReturn(name:string,anotherParam:any):any","helloer","start");
