import {FunctionDeclaration, Project} from 'ts-morph'
import { isFunctionDeclaration, isIdentifier } from 'typescript';
async function test() {
    const project = new Project({
      tsConfigFilePath:"/home/depinfo/Bureau/JeuxDeMotsTesting/design-dico/tsconfig.json",
  });
  const modules = project.getAmbientModules();
    // modules.forEach((modul)=>
    // console.log(modul.getName));
    // console.log(modules.length);
    // console.log(project);
    const files=project.getSourceFiles();    
    // console.log(files);
    console.log(files.length)
    files.forEach((file)=>{
            console.log(file.getBaseName())
           var statements=file.getClasses().forEach((classe)=>
                        classe.getMethods().forEach((method)=>
                            method.addStatements("console.log(\""+method.getName()+"\")")
                        )
           );
        //    statements.forEach((statemnt)=>
        //         {   console.log(isIdentifier(statemnt));
        //             if(isIdentifier(statemnt)){
        //             console.log(statemnt.getText());
        //         }
        //     });

    }    
    );
    await project.save()
  }

  test();
