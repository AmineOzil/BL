import {FunctionDeclaration, Project} from 'ts-morph'

async function injectLPS() {
    const project = new Project({
      tsConfigFilePath:"/home/depinfo/Bureau/JeuxDeMotsTesting/design-dico/tsconfig.json", //Passing the absolute path of my tsconfig.js file
  });
  //a simple log statement to confirm that the project is correctly loaded
  // console.log(project); 
   
    //Get the source files of my project
    const files=project.getSourceFiles();    
    //Log statement to confirm that all the source files were loaded
    console.log(files.length)
    //Iterating over each file to get the methods contained on his classes
    files.forEach((file)=>{
            //Log statement to print the names of all source files
            console.log(file.getBaseName())
            //Getting the classes of source file
           var statements=file.getClasses().forEach((classe)=>
                        classe.getMethods().forEach((method)=>
                            
                            // Adding LPS at the beginning of each method
                            method.insertStatements(0,"console.log(\""+method.getName()+"\")")
                            
                            //  Or adding LPS at the end of each method
                            //  method.addStatements("console.log(\""+method.getName()+"\")")
                        )
           );

    }    
    );
    console.log("Injection completed");
    await project.save();
    console.log("Project files updated!");
  }

  injectLPS();
