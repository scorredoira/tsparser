import * as lexer from "./lexer"

export function testTable() {
    let items = [
        ["FOO_BAR", "ident"],
        ["567", "number"],
        ["88.54", "number"],
        ["true", "true"],
        ["false", "false"],
        ["_foo", "ident"],
        ["let a = 3", "let", "ident", "=", "number"],
        ["{ a: 23 }", "{", "ident", ":", "number", "}",],
    ]

    for (let i = 0, l = items.length; i < l; i++) {
        let item = items[i]

        let src = item[0]

        let tokens = lexer.lex(src)
        let expected = item.slice(1)

        if (tokens.length != expected.length) {
            console.log(tokens)
            console.log(expected)
            throw "different"
        }

        for (let j = 0, k = expected.length; j < k; j++) {
            if (expected[j] != tokens[j].type) {
                throw fmt.errorf("%d -> expected %v, got %v", i, expected[j], tokens[j].type)
            }
        }
    }
}

export function testRegex() {
    let tokens = lexer.lex("/((\d+)h)?((\d+)m)?((\d+)s)?/")
    assert.equal(["string"], tokens.select(t => t.type))
}

export function testRegex2() {
    let tokens = lexer.lex("/((\d+)h)?((\d+)m)?((\d+)s)?/gi")
    assert.equal(["string"], tokens.select(t => t.type))
}
export function testRegex3() {
    let tokens = lexer.lex("/^(?:(https?\:)\/\/)?(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/")
    assert.equal(["string"], tokens.select(t => t.type))
}

export function testRegex4() {
    let tokens = lexer.lex(`match(/:(.*?);/)`)
    assert.equal(["ident", "(", "string", ")"], tokens.select(t => t.type))
}




export function testLexComment() {
    let tokens = lexer.lex(`
      // fooo99 bar
      // buzz fizz
    `)

    assert.equal(1, tokens.length)
    assert.equal("fooo99 bar\nbuzz fizz", tokens[0].value)
}

export function testLexComment3() {
    let tokens = lexer.lex(`
        /* foo */
        
        // bar  
    `)

    assert.equal(2, tokens.length)
    assert.equal("foo", tokens[0].value.trim())
    assert.equal("bar", tokens[1].value.trim())
}

export function testLexComment4() {
    let tokens = lexer.lex(`
        /* foo */
        
        // bar  
    `)

    assert.equal(2, tokens.length)
    assert.equal("foo", tokens[0].value.trim())
    assert.equal("bar", tokens[1].value.trim())
}

// export function testLexComment5() {
//     let tokens = lexer.lex(`
//         /* 
//             foo 
//                 bar
//         */  
//     `)

//     console.log(tokens)
// }

export function testLexMultiLineComment() {
    let tokens = lexer.lex(`/* fooo99 bar
 buzz fizz*/`)

    assert.equal(1, tokens.length)
    assert.equal("fooo99 bar\n buzz fizz", tokens[0].value.trim())
}

export function testStrings() {
    let tokens = lexer.lex(`Foo("{}")`)
    assert.equal(["ident", "(", "string", ")"], tokens.select(t => t.type))
}

export function testStrings2() {
    let tokens = lexer.lex(`Foo'ggg{}'`)
    assert.equal(["ident", "string"], tokens.select(t => t.type))
}

export function testStrings3() {
    let tokens = lexer.lex("a\b")
    assert.equal(["ident"], tokens.select(t => t.type))
}