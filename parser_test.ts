import * as parser from "./parser"

export function testParseClass() {
    assertClass(` 
        namespace fizz {   
            export class Foo {
                get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)
}


export function testParse_2() {
    assertClass(` 
        namespace fizz {   
            export class Foo {
                xxx: string = 33
                zzz: number
                aaa = true

                get bar(): number {
                    let x = 23
                }
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_22() {
    assertClass(` 
        namespace fizz {   
            export class Foo {
                private displayedOptions: Widget[]
                private highlightedIndex: number
                rows: Widget[]
                selectable: boolean

                get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_23() {
    assertClass(` 
        namespace fizz {   
            export class Foo {
                xxx: string = 33
                zzz: number[]
                aaa = true ?? "asdfasd"

                get bar(): number {
                    let x = 23
                }
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_24() {
    assertClass(` 
        namespace fizz {   
            export class Foo {
                xxx: string = 33
                type: "submit"

                get bar(): number {
                    let x = 23
                }
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_25() {
    assertClass(` 
        namespace fizz {   
            export class Foo {
                private bar: number
                public get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_26() {
    let p = parser.parseStr(` 
        namespace fizz {   
            export class Foo {
                xxx = 33
            }   
        }
    `)

    assert.equal("number", p.classes[0].fields[0].type)
}

export function testParse_27() {
    let p = parser.parseStr(` 
        namespace fizz {   
            export class Foo extends A.Bar {}   
        }
    `)

    assert.equal("A.Bar", p.classes[0].extends)
}

export function testParse_3() {
    let c = assertClass(` 
        namespace fizz {   
            export class Foo extends Widget {
                get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)

    assert.equal(c.extends, "Widget")
}


export function testParse_4() {
    assertClass(` 
        namespace fizz {
            registerWidget("A.Title", {
                text: { type: "string" },
                fontSize: { type: "style" }
            })
            export class Foo extends Widget {
                constructor(className?: string, parent?: Widget) {
                    super("div", "A-Title", parent)
        
                    if (className) {
                        addClass(this, className)
                    }
                }
        
                public get bar(): number {
                    return this.textContent
                }
                public set bar(v: number) {
                    this.textContent = T(v)
                }    
            }    
        }
    `)
}

export function testParse_5() {
    assertClass(` 
        namespace fizz {   
            export class Foo extends Widget {
                foo = yhtrtr == 2345
                get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_55() {
    parser.parseStr(` 
        namespace fizz {   
            export class Foo {
                domains: { [host: string]: string }
                printErrors: boolean
            }   
        }
    `)
}

export function testParse_6() {
    assertClass(` 
        namespace fizz { 
            
            export interface Action {}
            
            export class Foo extends Widget {
                get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_66() {
    assertClass(` 
        namespace fizz { 
            
            export interface Action {
                id?: string | number
                label?: string
            }
            
            export class Foo extends Widget {
                get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_7() {
    assertClass(` 
        namespace fizz { 
            
            let a = 234

            const BB = 4 + 2 * 6
            
            export class Foo extends Widget {
                get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_8() {
    assertClass(` 
        namespace fizz { 
            
            export type BAR = "asdfasdf"
            
            export type FIZZ = "asdfasdf" | "aasefd" | "asdfjj"          
            
            export class Foo extends Widget {
                get bar(): number {}
                set bar(v: number) {}
            }   
        }
    `)
}

export function testParse_9() {
    assertClass(` 
        namespace fizz {   
            export class Foo {
                public get bar(): number {}
                set bar(v: number) {}
            }  
            
            export function formatField(p: Field, value: any) {} 
        }
    `)
}

export function testParse_10() {
    let p = parser.parseStr(` 
        namespace fizz {   
            export class Foo {
                public get items(): Collection<Widget> {}
            }  
        }
    `)

    assert.equal("Collection<Widget>", p.classes[0].properties[0].type)
}

export function testParse_11() {
    let p = parser.parseStr(` 
        namespace fizz {   
            export class Foo {
                load: (text: string) => Promise<Option[]>
            }  
        }
    `)

    assert.equal(0, p.classes[0].properties.length)
}

export function testParse_12() {
    assertClass(` 
        namespace fizz {   
            export class Foo {
                private _value: string | number[]
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_13() {
    assertClass(` 
        namespace fizz {   
            export interface CollectionSignalListener<T> {
                type: ListenerType
                func: CollectionListener<T>
            }
            export class Foo {
                private _value: string | number[]
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_14() {
    assertClass(` 
        namespace fizz {   
            export type CollectionListener<T> = (v: T) => void
            export class Foo {
                private _value: string | number[]
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_15() {
    let p = parser.parseStr(` 
        namespace fizz { 
            export class Collection<T> extends Array<T> {
            } 
        }
    `)

    assert.equal(p.classes[0].name, "Collection<T>")
    assert.equal(p.classes[0].extends, "Array<T>")

}

export function testParse_16() {
    assertClass(` 
        namespace fizz {   
            let formats: any = {}
            export class Foo {
                private _value: string | number[]
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_17() {
    assertClass(` 
        namespace fizz {   
            
            let systemLocation = Intl.DateTimeFormat().resolvedOptions().timeZone

            export class Foo {
                private _value: string | number[]
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_19() {
    assertClass(` 
        namespace fizz { 
            export enum Weekday {
                Sunday = 0,
                Monday,
                Tuesday,
                Wednesday,
                Thursday,
                Friday,
                Saturday
            }           

            export class Foo {
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_20() {
    assertClass(` 
        namespace fizz {              

            export class Foo {
                constructor()
                constructor(date: Date, location?: string) {
                    
                }

                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_21() {
    assertClass(` 
        namespace fizz {     
            export function getMetaTag(key: string): string {}                     

            export class Foo {
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_30() {
    assertClass(` 
        namespace fizz {     
            export declare interface Map<T> {
                [key: string]: T
            }                             

            export class Foo {
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_31() {
    assertClass(` 
        namespace fizz {     
            export function clone<T>(obj: T): T {}                           

            export class Foo {
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_32() {
    assertClass(` 
        namespace fizz {     
            export class Foo {
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }

        String.prototype.splitEx = function (separator: string | RegExp) {}
    `)
}

export function testParse_322() {
    assertClass(` 
        namespace fizz {     
            export class Foo {
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }

        window.addEventListener("load", async () => {})
    `)
}

export function testParse_33() {
    assertClass(` 
        namespace fizz {     
            export class Foo {
                public get bar(): number {}
                set bar(v: number) {}
            }  
        }

        export type Translations = Map<Translation>

        export type Translation = string | Map<GenderVersion>

        export type GenderVersion = string | string[]
    `)
}

export function testParse_34() {
    assertClass(` 
        namespace fizz {                 
            export class Foo {

                addDOMEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
                }

                public get bar(): number {}
                set bar(v: number) {}
            }  
        }
    `)
}

export function testParse_35() {
    let p = parser.parseStr(` 
        namespace fizz {                 
            export abstract class Input extends Widget {
                required: boolean
                abstract get value(): any
                abstract set value(v: any)
                validations: Validation[]
            }
        }
    `)
}

export function testParse_36() {
    let p = parser.parseStr(` 
        namespace fizz {                 
            export class Signal {
                source?: Widget
            }
        }
    `)
}

export function testParse_37() {
    let p = parser.parseStr(` 
        export function isConditionGroup(v: ConditionGroup | Condition): v is ConditionGroup {
            return "logical" in v;
        }
    `)
}

export function testParse_38() {
    let p = parser.parseStr(` 
        export const RequiredValidation: Validation = v => {
        }    
    `)
}

export function testParse_39() {
    let p = parser.parseStr(` 
        class Signal {
            private async doClick() {}
        }  
    `)
}


export function testStringType() {
    let p = parser.parseStr(`              
            class Input {          
                foo: "bar"
            }
    `)

    assert.equal(`"bar"`, p.classes[0].fields[0].type)
}

export function testComments() {
    let p = parser.parseStr(` 
        namespace fizz {   
            export class Foo {
                // foo bar
                get bar(): number {}

                /* foo bar
                   foo bar
                */
                set fizz(v: number) {}
            }   
        }
    `)

    assert.equal("foo bar", p.classes[0].properties[0].comment.trim())
    assert.equal("foo bar foo bar", p.classes[0].properties[1].comment.replaceRegex("\s+", " ").trim())
}

export function testComments2() {
    let p = parser.parseStr(` 
        namespace fizz {   
            export class Foo {
                // FOO
                public get arrowHidden(): boolean {
                    return this.classList.contains("arrowHidden")
                }
                /* BAR */
                public set fizz(v: boolean) {
                }
            }   
        }
    `)

    assert.equal("FOO", p.classes[0].properties[0].comment.trim())
    assert.equal("BAR", p.classes[0].properties[1].comment.trim())
}

export function testComments3() {
    let p = parser.parseStr(`              
            class Input {
                // foo
                // bar            
                required: boolean
            }
    `)

    assert.equal("foo\nbar", p.classes[0].fields[0].comment)
}


export function testComments4() {
    let p = parser.parseStr(` 
        namespace fizz {    
            // foo bar             
            export class Signal {}
        }
    `)

    assert.equal("foo bar", p.classes[0].comment)
}

export function testComments5() {
    let p = parser.parseStr(` 
        namespace fizz {                 
            export class Input {
                /** meta: foo */
       
               // meta: bar
               type: string       
            }
        }
    `)

    assert.equal("meta: bar", p.classes[0].fields[0].comment)
}




function assertClass(code: string) {
    let p = parser.parseStr(code)
    assert.equal(1, p.classes.length)

    let c = p.classes[0]
    assert.isTrue(c.exported)
    assert.equal("fizz", c.namespace)
    assert.equal("Foo", c.name)

    assert.equal(1, c.properties.length)
    assert.isTrue(c.properties.all(t => t.name == "bar"))
    assert.isTrue(c.properties.all(t => t.type == "number"))
    assert.isTrue(c.properties[0].get && c.properties[0].set)

    return c
}