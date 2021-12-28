# Typescript parser for documentation

It just extracts classes with properties and fields and discards everything else.

example.ts

```typescript
import * as parser from "./parser"

let p = parser.parse(` 
    namespace fizz {   
        export class Foo {
            // FOO
            public get arrowHidden(): boolean {}
            // BAR
            public set arrowHidden(v: boolean) {}
        }   
    }
`)

console.log(p)
```

```
$ dune ./example.ts
```


```json
{
    "classes": [
        {
            "exported": true,
            "fields": [],
            "module": "fizz",
            "name": "Foo",
            "properties": [
                {
                    "comment": "FOO",
                    "get": true,
                    "isAbstract": null,
                    "isPrivate": null,
                    "isProtected": null,
                    "name": "arrowHidden",
                    "type": "boolean"
                },
                {
                    "comment": "BAR",
                    "isAbstract": false,
                    "isPrivate": false,
                    "isProtected": false,
                    "name": "arrowHidden",
                    "set": true,
                    "type": "boolean"
                }
            ]
        }
    ]
}
```