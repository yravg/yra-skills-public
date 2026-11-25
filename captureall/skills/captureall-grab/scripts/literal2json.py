"""Turn the first object literal after `var <name>=` in a minified chunk (e.g. `var e={...};export{e as docs}`)
into JSON, without executing anything. Handles objects, arrays, `template` / "double" / 'single' strings,
numbers, !0 / !1, null, void 0, true, false. Refuses template literals with ${} expressions.

Usage: python -I literal2json.py <chunk.js> [var-name]
"""
import json
import re
import sys


class Parser:
    def __init__(self, text):
        self.t, self.i = text, 0

    def ws(self):
        while self.i < len(self.t) and self.t[self.i] in " \n\r\t":
            self.i += 1

    def val(self):
        self.ws()
        c = self.t[self.i]
        if c == "{":
            return self.obj()
        if c == "[":
            return self.arr()
        if c in "`\"'":
            return self.string(c)
        if self.t.startswith("!0", self.i):
            self.i += 2
            return True
        if self.t.startswith("!1", self.i):
            self.i += 2
            return False
        m = re.compile(r"-?\d+(\.\d+)?(e-?\d+)?").match(self.t, self.i)
        if m:
            self.i = m.end()
            return float(m.group()) if (m.group(1) or m.group(2)) else int(m.group())
        m = re.compile(r"(null|void 0|true|false)").match(self.t, self.i)
        if m:
            self.i = m.end()
            return {"null": None, "void 0": None, "true": True, "false": False}[m.group()]
        raise ValueError(f"unexpected {self.t[self.i:self.i + 40]!r}")

    def string(self, q):
        self.i += 1
        out = []
        while self.t[self.i] != q:
            c = self.t[self.i]
            if c == "\\":
                n = self.t[self.i + 1]
                if n == "u":
                    out.append(chr(int(self.t[self.i + 2:self.i + 6], 16)))
                    self.i += 6
                    continue
                if n == "x":
                    out.append(chr(int(self.t[self.i + 2:self.i + 4], 16)))
                    self.i += 4
                    continue
                out.append({"n": "\n", "t": "\t", "r": "\r"}.get(n, n))
                self.i += 2
                continue
            if q == "`" and self.t.startswith("${", self.i):
                raise ValueError("template expression: read this value by hand")
            out.append(c)
            self.i += 1
        self.i += 1
        return "".join(out)

    def obj(self):
        self.i += 1
        o = {}
        while True:
            self.ws()
            if self.t[self.i] == "}":
                self.i += 1
                return o
            if self.t[self.i] in "`\"'":
                k = self.string(self.t[self.i])
            else:
                m = re.compile(r"[\w$]+").match(self.t, self.i)
                k = m.group()
                self.i = m.end()
            self.ws()
            assert self.t[self.i] == ":", self.t[self.i:self.i + 30]
            self.i += 1
            o[k] = self.val()
            self.ws()
            if self.t[self.i] == ",":
                self.i += 1

    def arr(self):
        self.i += 1
        a = []
        while True:
            self.ws()
            if self.t[self.i] == "]":
                self.i += 1
                return a
            a.append(self.val())
            self.ws()
            if self.t[self.i] == ",":
                self.i += 1


def parse(text, name=None):
    at = text.index(f"var {name}" if name else "var ")
    return Parser(text[text.index("{", at):]).val()


if __name__ == "__main__":
    assert parse('var e={a:`x`,b:[1,!0,"y\\u2013"],c:{d:void 0}};') == {"a": "x", "b": [1, True, "y–"], "c": {"d": None}}
    src = open(sys.argv[1], encoding="utf-8").read()
    print(json.dumps(parse(src, sys.argv[2] if len(sys.argv) > 2 else None), ensure_ascii=False, indent=2))
