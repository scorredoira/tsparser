

export type Type =
    "EOF" |
    "ident" |
    "operator" |
    "comparer" |
    "=" |
    "(" |
    "[" |
    "{" |
    "," |
    "." |
    ")" |
    "]" |
    "}" |
    ";" |
    ":" |
    "=" |
    "=>" |
    "comment" |
    "multiLineComment" |
    "number" |
    "string" |
    "true" |
    "false" |
    "if" |
    "else" |
    "for" |
    "while" |
    "break" |
    "continue" |
    "return" |
    "import" |
    "export" |
    "function" |
    "interface" |
    "var" |
    "let" |
    "const" |
    "enum" |
    "switch" |
    "case" |
    "default" |
    "null" |
    "undefined" |
    "try" |
    "catch" |
    "throw" |
    "finally" |
    "new" |
    "class" |
    "type" |
    "delete" |
    "typeof" |
    "namespace" |
    "get" |
    "set" |
    "private" |
    "protected" |
    "public" |
    "abstract" |
    "static" |
    "async" |
    "declare" |
    "is"


export const Keyword = [
    "true",
    "false",
    "if",
    "else",
    "for",
    "while",
    "break",
    "continue",
    "return",
    "import",
    "export",
    "function",
    "interface",
    "var",
    "let",
    "const",
    "enum",
    "switch",
    "case",
    "default",
    "null",
    "undefined",
    "try",
    "catch",
    "throw",
    "finally",
    "new",
    "class",
    "type",
    "delete",
    "typeof",
    "namespace",
    "get",
    "set",
    "private",
    "protected",
    "public",
    "abstract",
    "static",
    "async",
    "declare",
    "is"
]

export const Operators = [
    "+",
    "-",
    "*",
    "/",
    "%",
    "&",
    "|",
    "^",
    "<<",
    ">>",
    "~",
    "~~",
    "?",
    "+=",
    "-=",
    "*=",
    "/=",
    "^=",
    "|=",
    "%="
]

export const Comparers = [
    "&&",
    "||",
    "??",
    "++",
    "--",
    "**",
    "==",
    "!=",
    "<",
    ">",
    "=",
    "!",
    "<=",
    ">=",
    "===",
    "!==",
]



const EOF: string = null

export interface Token {
    type: Type
    value?: string
    line?: number
    endLine?: number
    column?: number
}

export function lex(src: string) {
    let lexer = new Lexer()
    return lexer.lex(src)
}

class Lexer {
    private src: string
    private tokens: Token[]
    private index: number
    private maxIndex: number
    private line: number
    private column: number

    lex(src: string) {
        this.src = src
        this.tokens = []
        this.index = 0
        this.maxIndex = src.length - 1
        this.line = 0
        this.column = 0

        while (true) {
            this.skipWhiteSpace()

            let c = this.next()
            if (c == EOF) {
                break
            }

            // get the line at the beginning
            let line = this.line

            try {
                this.lexChar(c)
            } catch (error) {
                throw fmt.errorf("%w at %d:%d", error, line + 1, this.column)
            }
        }

        return this.tokens
    }

    private lexChar(c: string) {
        if (isIdent(c, 0)) {
            this.readIdent(c)
            return
        }

        if (isDecimal(c)) {
            this.readNumber(c)
            return
        }

        switch (c) {
            case "+":
            case "-":
            case "*":
            case "%":
            case "&":
            case "|":
            case "^":
            case "<":
            case ">":
            case "~":
            case "?":
            case "!":
                this.readOperatorOrComparer(c)
                break

            case "/":
                switch (this.peek()) {
                    case "/":
                        this.readComment()
                        break

                    case "*":
                        this.readMultilineComment()
                        break

                    default:
                        // Basic heuristic to check if it is a divide operator or a regex: 
                        switch (this.tokens.last()?.type) {
                            case "number":
                            case "ident":
                            case ")":
                            case "]":
                                this.readOperatorOrComparer(c)
                                break

                            default:
                                this.readRegex()
                        }
                        break
                }
                break

            case "(":
            case "[":
            case "{":
            case ",":
            case ".":
            case ")":
            case "]":
            case "}":
            case ";":
            case ":":
                this.emit(c, c)
                break

            case "=":
                if (this.next() == ">") {
                    this.emit("=>", "=>")
                } else {
                    this.emit("=", "=")
                }
                break

            case "\\":
                // ignore scape characters
                this.next()
                break

            case "'":
            case "\"":
                this.readString(c)
                break

            case "`":
                this.readMultilineString()
                break
        }
    }

    private readRegex() {
        let last
        let buf = ["/"]

        LOOP:
        while (true) {
            let c = this.next()

            switch (c) {
                case EOF:
                case "\n":
                    throw "unclosed regex"

                case "/":
                    if (last != '\\') {
                        break LOOP
                    }
                    break
            }

            buf.push(c)
            last = c
        }

        LOOP:
        while (true) {
            let t = this.peek()
            switch (t) {
                case "g":
                case "i":
                    buf.push(t)
                    this.next()
                    break

                default:
                    break LOOP
            }
        }

        this.emit("string", buf.join())
    }

    private skipWhiteSpace() {
        LOOP:
        while (true) {
            switch (this.peek()) {
                case "\t":
                case "\n":
                case "\r":
                case " ":
                    this.next()
                    continue LOOP
            }
            break
        }
    }

    private emitComment(type: Type, v: string, startLine?: number) {
        switch (type) {
            // merge consecutive single line comments if they are together
            case "comment":
                let last = this.tokens.last()
                if (last?.type == "comment") {
                    // make sure that they are consecutive
                    if (this.line == last.endLine + 1) {
                        last.value += "\n" + v

                        // tokens have the last line as position.
                        // In comments it allows to check if they are 
                        // inmediately before a token
                        last.endLine = this.line
                        return
                    }
                }
                break

            case "multiLineComment":
                // treat multiline comments as regular comments
                type = "comment"
                break
        }

        this.emit(type, v, startLine)
    }

    private emit(type: Type, v: string, startLine?: number) {
        this.tokens.push({
            type: type,
            value: v,
            line: startLine ?? this.line,
            endLine: this.line,
            column: this.column
        })
    }

    private readMultilineString() {
        let startLine = this.line

        let buf = []

        LOOP:
        while (true) {
            let c = this.next()
            switch (c) {
                case EOF:
                    throw "Unterminated string"

                case "`":
                    break LOOP

                default:
                    buf.push(c)
                    break
            }
        }

        this.emit("string", buf.join(), startLine)
    }

    private readString(quoteType: string) {
        let buf = []

        LOOP:
        while (true) {
            let c = this.next()
            switch (c) {
                case EOF:
                case "\n":
                    throw "Unterminated string"

                case "\\":
                    // ignore scape characters
                    this.next()
                    continue

                case quoteType:
                    break LOOP

                default:
                    buf.push(c)
                    break
            }
        }

        this.emit("string", buf.join())
    }

    private readComment() {
        this.next()

        let buf = []

        LOOP:
        while (true) {
            switch (this.peek()) {
                case EOF:
                case "\n":
                    this.emitComment("comment", buf.join().trim())
                    this.next()
                    break LOOP

                default:
                    buf.push(this.next())
                    break
            }
        }
    }

    private readMultilineComment() {
        let line = this.line
        this.next()

        let buf = []

        LOOP:
        while (true) {
            let c = this.next()
            switch (c) {
                case EOF:
                    throw "Unterminated multiline comment"

                case "\\":
                    // ignore scape characters
                    buf.push(c)
                    this.next()
                    break

                case "*":
                    if (this.peek() == "/") {
                        this.emitComment("multiLineComment", buf.join(), line)
                        this.next()
                        break LOOP
                    }
                    break
            }

            buf.push(c)
        }
    }

    private readNumber(c: string) {
        let buf = [c]
        while (true) {
            let n = this.peek()
            if (n === EOF) {
                break
            }
            if (n != "." && !isDecimal(n)) {
                break
            }
            buf.push(this.next())
        }
        this.emit("number", buf.join())
    }

    private readIdent(c: string) {
        let buf = [c]

        while (isIdent(this.peek(), 1)) {
            buf.push(this.next())
        }

        let word = buf.join()

        if (Keyword.contains(word)) {
            this.emit(<Type>word, word)
            return
        }

        this.emit("ident", word)
    }

    private peek(advance?: number) {
        let i = this.index + (advance ?? 0)
        if (i > this.maxIndex) {
            return EOF
        }
        return this.src[i]
    }

    private next() {
        let c = this.peek()
        if (c == EOF) {
            return c
        }

        this.index++

        switch (c) {
            case EOF:
                return c

            case "\n":
                this.line++
                this.column = 0
                return c

            default:
                this.column++
                return c
        }
    }


    private readOperatorOrComparer(c: string) {
        let buf = [c]
        while (true) {
            c = this.peek()
            if (!isOperator(c)) {
                break
            }
            buf.push(c)
            this.next()
        }

        let str = buf.join()

        if (Operators.contains(str)) {
            this.emit("operator", str)
            return
        }

        if (Comparers.contains(str)) {
            this.emit("comparer", str)
            return
        }

        throw "invalid operator or comparer"
    }
}

function isIdent(c: string, pos: number) {
    if (c == EOF) {
        return false
    }
    return c == '_' || 'A' <= c && c <= 'Z' || 'a' <= c && c <= 'z' || isDecimal(c) && pos > 0
}

function isDecimal(c: string) {
    if (c == EOF) {
        return false
    }
    return '0' <= c && c <= '9'
}

function isOperator(c: string) {
    switch (c) {
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
        case "&":
        case "|":
        case "^":
        case "~":
        case "?":
        case "!":
            return true

        default:
            return false
    }
}
