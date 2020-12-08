# BL Loger
A tool that automates LPSes injection on Angular, regarding specific constraints.

## Installation : 
- First of all we have to install ts-morph using **yarn** :
	 `yarn add ts-morph typescript`

## Instantiation
to instantiate our project, we need to manually specify the path to our *tsconfig.json* file :   
```ts
import { Project} from 'ts-morph'

const project = new Project({
tsConfigFilePath:"<path-to-our-project>/tsconfig.json",
}); 
```
## Some useful functions and their usages :
```project.getSourceFiles()``` : returns a *SourceFile[]* containing all *ts* source files that exist on the project.
```project.getSourceFileOrThrow('<absolute-path>/file.ts')``` : gets the source file, or throws an errors if it doesn't exist.
```sourceFile.getClasses()``` : returns a *ClassDeclaration[]* with all class declaration children in the actual *sourceFile*.
```sourceFile.getClassOrThrow("nameOfTheClass")``` : gets a class or throws if it doesn't exists.
```classDeclaration.getMethods() ``` : returns a *MethodDeclaration[]* containing the class method declarations regardless of whether it's an instance of static method.
```classDeclaration.getConstructors()``` : returns a *ConstructionDeclaration[]* that contains constructor declarations.
``` classDeclaration.getProperties() ``` : Gets the class property declarations regardless of whether it's an instance of static property.
```method.getName()``` : gets the name of the actual method.
```method.addStatements("console.log(\""+method.getName()+"\")")``` : adds the statements passed in parameter at the end of the actual *method*.
```method.insertStatements(int index,"console.log()")``` : adds the statements passed in parameter at the specified index.
```await project.save()``` : Saves all the unsaved source files to the file system and deletes all deleted files.
