import {FunctionDeclaration, Project} from 'ts-morph'

async function injectLPS() {
    const project = new Project(//{
  //     tsConfigFilePath:"/home/depinfo/Bureau/JeuxDeMotsTesting/design-dico/tsconfig.json", //Passing the absolute path of my tsconfig.js file
  // }
  );
  //a simple log statement to confirm that the project is correctly loaded
  // console.log(project); 
  project.addSourceFilesAtPaths(["/home/depinfo/Bureau/JeuxDeMotsTesting/design-dico/**/*{.js,.ts}","!/home/depinfo/Bureau/JeuxDeMotsTesting/design-dico/node_modules","!/home/depinfo/Bureau/JeuxDeMotsTesting/design-dico/**/*.*.js"]);

    //Get the source files of my project
    const files=project.getSourceFiles();    
    //Log statement to confirm that all the source files were loaded
    console.log(files.length)
    //Iterating over each file to get the methods contained on his classes
    files.forEach((file)=>{
            //Log statement to print the names of all source files
            console.log(file.getFilePath());
            file.getClasses().forEach(element => {
              console.log("The class name is: "+element.getName());
              console.log("It has :"+element.getConstructors().length+" constructors");

              element.getMethods().forEach(method=>{
                  if(method.getStatements()[0])
                  var linenumber=method.getStatements()[0].getStartLineNumber();
                  else linenumber=method.getStartLineNumber()+1
                  method.insertStatements(0,"console.log(Date.now()+\": "+method.getName()+" is called from WebRequest: "+element.getName()+" on line number:"+linenumber+"\");");
              
                  if((method.getStatements()[method.getStatements().length-1]).getText().includes('return')) {
                               var linenumber=method.getStatements()[method.getStatements().length-1].getStartLineNumber();
                               method.insertStatements(method.getStatements().length-1,"console.log(Date.now()+\" "+method.getName()+" has been called from WebRequest: "+element.getName()+" on line number:"+linenumber+"\");");
                  }
                  else{
                      var linenumber=method.getStatements()[method.getStatements().length-1].getEndLineNumber()+1;
                      method.addStatements("console.log(Date.now()+\" "+method.getName()+" has been called from WebRequest: "+element.getName()+" on line number:"+linenumber+"\");")
                  } 
                           })
              
              // if(element.getConstructors().length==0)
              // element.addConstructor(  {statements: "console.log(\"The class (Web request):"+element.getName()+" has been called\");",}
              // );
              
              // file.insertStatements(1,"console.log('I''m testing')");
            });
            file.getStatements().forEach(statement=> statement.getDescendantStatements().forEach(ministat=>{
                console.log(ministat.getStartLineNumber());
            }));
          //   //Getting the classes of source file
          //  var statements=file.getFunctions().forEach((method)=>            
          //                   // Adding LPS at the beginning of each method
          //                   method.insertStatements(0,"console.log(\""+method.getName()+"\")"),
          //                   console.log("I'm injecting a log in a method")
          //                   //  Or adding LPS at the end of each method
          //                   //  method.addStatements("console.log(\""+method.getName()+"\")")
                        
          //  );

    }    
    );
    console.log("Injection completed");

    await project.save();
    console.log("Project files updated!");
  }

  injectLPS();
