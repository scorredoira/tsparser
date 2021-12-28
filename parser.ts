import * as lexer from "./lexer"

export function parse(file: string) {
    let p = new Parser().parse(file)
    return p
}

export function parseStr(src: string) {
    let p = new Parser().parseString(src)
    return p
}

const EOF: lexer.Token = { type: "EOF" }

export interface Program {
    classes: Class[]
}

export interface Class {
    namespace?: string
    extends?: string
    exported?: boolean
    name: string
    comment?: string
    properties?: Property[]
    fields?: Field[]
}

export interface Field {
    name: string
    type?: string
    comment?: string
    isPrivate?: boolean
    isProtected?: boolean
    isAbstract?: boolean
    isStatic?: boolean
}

export interface Property extends Field {
    get?: boolean
    set?: boolean
}

class Parser {
    private index: number
    private maxIndex: number
    private tokens: lexer.Token[]
    private program: Program
    private file: string

    parse(file: string) {
        let src = os.readString(file)
        return this.parseString(src, file)
    }

    parseString(src: string, file?: string) {
        this.file = file
        this.tokens = lexer.lex(src)
        this.index = 0
        this.maxIndex = this.tokens.length - 1

        this.program = {
            classes: []
        }

        LOOP:
        while (true) {
            let t = this.peek()
            switch (t.type) {
                case "EOF":
                    break LOOP

                case "comment":
                    this.next()
                    break

                case "namespace":
                    this.next()
                    this.parseNamespace()
                    break;

                default:
                    this.parseStatements(null)
                    break
            }
        }

        return this.program
    }

    private parseNamespace() {
        let namespace = this.next().value
        this.accept("{")
        this.parseStatements(namespace)
        this.accept("}")
    }

    private parseStatements(namespace: string) {
        let exported
        let comment

        LOOP:
        while (true) {
            let t = this.peek()

            switch (t.type) {
                case "comment":
                    comment = t.value
                    this.next()
                    continue LOOP

                case "export":
                    this.next()
                    exported = true
                    continue LOOP

                case "abstract":
                    this.next()
                    continue LOOP

                case "declare":
                    this.next()
                    continue LOOP

                case "async":
                    this.next()
                    continue LOOP

                case "import":
                    this.parseImport()
                    break

                case "class":
                    this.next()
                    let c = this.parseClass(namespace, exported)
                    c.comment = comment
                    this.program.classes.push(c)
                    break

                case "interface":
                    this.next()
                    this.parseInterface()
                    break

                case "function":
                    this.next()
                    this.parseFunction()
                    break

                case "enum":
                    this.next()
                    this.parseEnum()
                    break

                case "type":
                    this.next()
                    this.parseTypeDeclStmt()
                    break

                case "var":
                case "let":
                case "const":
                    this.next()
                    this.parseVarDeclStmt()
                    break

                case "ident":
                    this.parseExpr()
                    break

                case "}":
                case "EOF":
                    break LOOP

                default:
                    throw this.parseError("invalid token: %s", t.type)
            }

            comment = null
        }
    }

    private parseImport() {
        this.accept("import")

        let t = this.next()
        switch (t.type) {
            case "string":
                // import for side effects
                return

            case "operator":
                if (t.value != "*") {
                    throw fmt.errorf("invalid token: %s", t.value)
                }
                break

            case "ident":
                break

            default:
                throw fmt.errorf("invalid token: %s", t.value)
        }

        this.accept("ident", "as")
        this.accept("ident")
        this.accept("ident", "from")
        this.accept("string")
    }

    private parseFunction() {
        this.acceptAny("ident", "get", "set")
        if (this.is(this.peek(), "comparer", "<")) {
            this.skipGeneric()
        }

        this.skipSymbol("(", ")")

        if (this.peek().type == ":") {
            this.next()
            this.parseType()
        }

        this.skipBlock()

        this.ignore(";")
    }

    private parseVarDeclStmt() {
        let t = this.acceptAny("ident", "type", "class")
        this.parseField(t.value)
        this.ignore(";")
    }

    private parseEnum() {
        this.accept("ident")
        this.skipBlock()
        this.ignore(";")
    }

    private parseInterface() {
        this.accept("ident")
        if (this.is(this.peek(), "comparer", "<")) {
            this.skipGeneric()
        }

        if (this.peek().value == "extends") {
            this.next()
            this.parseType()
        }

        this.skipBlock()
        this.ignore(";")
    }

    private parseClass(namespace: string, exported: boolean) {
        let t = this.accept("ident")
        let v = t.value
        if (this.is(this.peek(), "comparer", "<")) {
            v += this.skipGeneric()
        }
        let name = v

        let c: Class = {
            name: name,
            namespace: namespace,
            exported: exported,
            fields: [],
            properties: [],
        }

        if (this.peek().value == "extends") {
            this.next()
            c.extends = this.parseType()
        }

        this.accept("{")

        let isPrivate: boolean
        let isProtected: boolean
        let isAbstract: boolean
        let isStatic: boolean
        let comment: lexer.Token

        LOOP:
        while (true) {
            let t = this.next()
            switch (t.type) {
                case "comment":
                    comment = t
                    continue LOOP

                case "public":
                    continue LOOP

                case "async":
                    continue LOOP

                case "static":
                    isStatic = true
                    continue LOOP

                case "abstract":
                    isAbstract = true
                    continue LOOP

                case "private":
                case "protected":
                    isPrivate = true
                    continue LOOP

                case "get":
                    if (this.peek().type == "(") {
                        this.parseMethod()
                    } else {
                        var p = this.parseGetter(isAbstract)
                        var exists = c.properties.first(t => t.name == p.name)
                        if (exists) {
                            exists.get = true
                            if (!exists.comment) {
                                exists.comment = this.getComment(comment, t)
                            }
                        } else {
                            p.isPrivate = isPrivate
                            p.isAbstract = isAbstract
                            p.isProtected = isProtected
                            p.isStatic = isStatic
                            p.comment = this.getComment(comment, t)
                            c.properties.push(p)
                        }
                    }
                    break

                case "set":
                    if (this.peek().type == "(") {
                        this.parseMethod()
                    } else {
                        var p = this.parseSetter(isAbstract)
                        var exists = c.properties.first(t => t.name == p.name)
                        if (exists) {
                            exists.set = true
                            if (!exists.comment) {
                                exists.comment = this.getComment(comment, t)
                            }
                        } else {
                            p.isPrivate = isPrivate
                            p.isAbstract = isAbstract
                            p.isProtected = isProtected
                            p.isStatic = isStatic
                            p.comment = this.getComment(comment, t)
                            c.properties.push(p)
                        }
                    }
                    break

                case "type":
                case "ident":
                case "is":
                    let name = t.value

                    if (this.is(this.peek(), "comparer", "<")) {
                        this.skipGeneric()
                    }

                    this.ignoreOperator("?")

                    switch (this.peek().type) {
                        case "(":
                            this.parseMethod()
                            break

                        case ":":
                        case "=":
                            let f = this.parseField(name)
                            f.isPrivate = isPrivate
                            f.isAbstract = isAbstract
                            f.isProtected = isProtected
                            f.isStatic = isStatic
                            f.comment = this.getComment(comment, t)
                            c.fields.push(f)
                            break

                        default:
                            throw this.parseError("invalid token: %s", t.type)
                    }
                    break

                case "}":
                    break LOOP

                default:
                    throw this.parseError("invalid token: %s", t.type)
            }

            // reset attributes
            isPrivate = false
            isProtected = false
            isAbstract = false
            isStatic = false
            comment = null
        }

        return c
    }

    private getComment(comment: lexer.Token, t: lexer.Token) {
        if (!comment) {
            return
        }
        if (comment.endLine + 1 == t.endLine) {
            return comment.value
        }
    }


    private parseMethod() {
        // skip args
        this.skipSymbol("(", ")")

        if (this.peek().type == ":") {
            this.next()
            this.parseType()
        }

        /**
         * In case it is a polymorphic declaration:
         * 
         * constructor()
         * constructor(date: Date, location?: string)
         * constructor(date: string, location?: string)
         * 
         */
        if (this.peek().type == "ident") {
            this.next()
            this.parseMethod()
            return
        }

        // skip body
        this.skipBlock()
        this.ignore(";")

    }

    private parseField(name: string) {
        let f: Field = { name: name }

        if (this.peek().type == ":") {
            this.next()
            f.type = this.parseType()
        }

        if (this.peek().type == "=") {
            this.next()
            let exp = this.parseExpr()
            if (!f.type) {
                if (strings.isNumeric(exp)) {
                    f.type = "number"
                } else {
                    f.type = "any"
                }
            }
        }

        this.ignore(";")

        return f
    }

    private parseExpr() {
        var buf: string[] = []

        LOOP:
        while (true) {
            buf.push(this.parseValueExpression())
            var n = this.peek()

            if (lexer.Operators.contains(n.value)) {
                buf.push(this.next().value)
                continue LOOP
            }

            if (lexer.Comparers.contains(n.value)) {
                buf.push(this.next().value)
                continue LOOP
            }

            break
        }

        return buf.join()
    }

    private parseValueExpression() {
        var buf: string[] = []

        buf.push(this.parseSimpleValueExpression())

        LOOP:
        while (true) {
            let t = this.peek()
            switch (t.type) {
                case ".":
                    buf.push(this.next().value)
                    buf.push(this.parseValueExpression())
                    break

                case "(":
                    buf.push(this.skipSymbol("(", ")"))
                    break

                case "[":
                    buf.push(this.skipSymbol("[", "]"))
                    break

                case "is":
                    this.next()
                    buf.push(this.parseExpr())
                    break

                default:
                    break LOOP
            }
        }

        return buf.join()
    }

    private parseSimpleValueExpression() {
        let buf: string[] = []

        let t = this.peek()
        switch (t.type) {
            case "(":
                buf.push(this.skipSymbol("(", ")"))
                if (this.peek().type == "=>") {
                    buf.push(this.next().value)
                    if (this.peek().type == "{") {
                        buf.push(this.skipBlock())
                    } else {
                        buf.push(this.parseExpr())
                    }
                }
                break

            case "function":
                buf.push(this.next().value)
                if (this.is(this.peek(), "comparer", "<")) {
                    buf.push(this.skipGeneric())
                }
                buf.push(this.skipSymbol("(", ")"))
                if (this.peek().type == ":") {
                    buf.push(this.next().value)
                    buf.push(this.parseType())
                }
                buf.push(this.skipBlock())
                break

            case "[":
                buf.push(this.skipSymbol("[", "]"))
                break

            case "{":
                buf.push(this.skipSymbol("{", "}"))
                break

            case "number":
            case "true":
            case "false":
            case "null":
            case "undefined":
                buf.push(this.next().value)
                break

            case "string":
                buf.push(json.marshal(this.next().value))
                break

            case "ident":
                buf.push(this.parseIdentExpr())
                break

            default:
                throw this.parseError("invalid token: %s", t.type)
        }

        return buf.join()
    }


    private parseSimpleIdentExpression() {
        let buf = []

        while (true) {
            let t = this.accept("ident")
            buf.push(t.value)

            if (this.peek().type == ".") {
                buf.push(this.next().value)
                continue
            }

            break
        }

        return buf.join()
    }

    private parseIdentExpr() {
        var buf: string[] = []

        buf.push(this.parseSimpleIdentExpression())

        if (this.peek().type == "=>") {
            buf.push(this.next().value)
            if (this.peek().type == "{") {
                buf.push(this.skipBlock())
            } else {
                buf.push(this.parseExpr())
            }
            return
        }

        if (this.is(this.peek(), "comparer", "<")) {
            buf.push(this.skipGeneric())
        }

        return buf.join()
    }

    private parseGetter(isAbstract: boolean) {
        let name = this.acceptAny("ident", "type", "class").value

        let p: Property = {
            name: name,
            get: true
        }

        this.accept("(")
        this.accept(")")

        if (this.peek().type == ":") {
            this.next()
            p.type = this.parseType()
        } else {
            p.type = "any"
        }

        if (!isAbstract) {
            this.skipBlock()
        }

        return p
    }

    private parseSetter(isAbstract: boolean) {
        let name = this.acceptAny("ident", "type", "class").value

        let p: Property = {
            name: name,
            set: true
        }

        this.accept("(")
        this.accept("ident")

        if (this.peek().type == ":") {
            this.next()
            p.type = this.parseType()
        } else {
            p.type = "any"
        }

        this.accept(")")

        if (!isAbstract) {
            this.skipBlock()
        }

        return p
    }

    private parseTypeDeclStmt() {
        this.accept("ident")

        if (this.is(this.peek(), "comparer", "<")) {
            this.skipGeneric()
        }

        this.accept("=")

        LOOP:
        while (true) {
            this.parseExpr()

            let t = this.peek()
            if (t.type == "operator" && t.value == "|") {
                this.next()
                continue
            }

            break
        }
    }

    private parseType() {
        return this.parseExpr()
    }

    private ignoreOperator(value: string) {
        if (this.is(this.peek(), "operator", value)) {
            this.next()
        }
    }

    private ignore(type: lexer.Type, value?: string) {
        if (this.is(this.peek(), type, value)) {
            this.next()
        }
    }

    private is(t: lexer.Token, type: lexer.Type, value?: string) {
        if (t?.type != type) {
            return false
        }

        if (value && t.value != value) {
            return false
        }

        return true
    }

    private skipBlock() {
        return this.skipSymbol("{", "}")
    }

    private acceptAny(...types: lexer.Type[]) {
        let t = this.next()

        if (!types.contains(t.type)) {
            throw this.parseError("expected %s, got %s: '%s'", types.join(" or "), t.type, convert.toString(t.value ?? "").take(20))
        }

        return t
    }

    private accept(type: lexer.Type, value?: string) {
        let t = this.next()

        if (t?.type != type) {
            throw this.parseError("expected %s, got %s: '%s'", type, t.type, convert.toString(t.value ?? "").take(20))
        }

        if (value && t.value != value) {
            throw this.parseError("expected %s, got %s", value, convert.toString(t.value ?? "").take(20))
        }

        return t
    }

    private skipSymbol(open: lexer.Type, close: lexer.Type) {
        let t = this.accept(open)

        let buf = [t.value]

        let nesting = 0

        LOOP:
        while (true) {
            let t = this.next()
            buf.push(t.value)

            switch (t.type) {
                case open:
                    nesting++
                    break;

                case close:
                    if (nesting == 0) {
                        break LOOP
                    }
                    nesting--
                    break
            }
        }

        return buf.join()
    }

    private skipGeneric() {
        let t = this.accept("comparer", "<")

        let buf = [t.value]

        let nesting = 0

        LOOP:
        while (true) {
            let t = this.next()
            buf.push(t.value)

            switch (t.type) {
                case "EOF":
                    throw this.parseError("invalid token")

                case "comparer":
                    switch (t.value) {
                        case "<":
                            nesting++
                            break
                        case ">":
                            if (nesting == 0) {
                                break LOOP
                            }
                            nesting--
                            break
                    }
            }
        }

        return buf.join()
    }

    private parseError(err: string, ...args: any[]) {
        let msg = fmt.sprintf(err, ...args)

        let t = this.peek()
        if (t == EOF) {
            return fmt.sprintf("%s: EOF", msg)
        }

        if (this.file) {
            return fmt.sprintf("%s at %s:%d:%d", msg, this.file, t.line + 1, t.column)
        } else {
            return fmt.sprintf("%s at %d:%d", msg, t.line + 1, t.column)
        }
    }

    private next(): lexer.Token {
        if (this.index > this.maxIndex) {
            return EOF
        }

        let t = this.tokens[this.index]
        this.index++
        return t
    }

    private peek(advance?: number): lexer.Token {
        let i = this.index + (advance ?? 0)
        if (i > this.maxIndex) {
            return EOF
        }
        return this.tokens[i]
    }
}

// the first line with content marks the indentation
export function indentComment(comment: string) {
    let lines = comment.split("\n")
    if (lines.length <= 2) {
        return markdown.toHTML(comment.trim())
    }

    let indent

    for (let i = 0, l = lines.length; i < l; i++) {
        let line = lines[i]

        if (indent == null) {
            if (line.trim() != "") {
                let m = regex.findAllStringSubmatch("^\s+", line)
                if (m.length > 0) {
                    indent = m[0][0]
                } else {
                    indent = ""
                }
            }
        }

        if (indent) {
            lines[i] = line.trimPrefix(indent)
        }
    }

    return lines.join("\n")
}