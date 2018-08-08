export default {
    // LZW-compress a string
    encode(s: string) : string {
        var dict:Record<string, number> = {};
        var data = (s + "").split("");
        var out:number[] = [];
        var currChar;
        var phrase = data[0];
        var code = 256;
        for (var i=1; i<data.length; i++) {
            currChar=data[i];
            if (dict[phrase + currChar] != null) {
                phrase += currChar;
            }
            else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[phrase + currChar] = code;
                code++;
                phrase=currChar;
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        return out.map( v => String.fromCharCode(v) ).join("");
    },

    // Decompress an LZW-encoded string
    decode(s: string): string {
        const dict:Record<string, any> = {};
        const data: string[] = (s + "").split("");
        let currChar: string = data[0];
        let oldPhrase: any = currChar;
        const out: string[] = [currChar];
        let code: number = 256;
        let phrase: any;
        for (var i=1; i<data.length; i++) {
            var currCode = data[i].charCodeAt(0);
            if (currCode < 256) {
                phrase = data[i];
            } else {
            phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dict[code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        return out.join("");
    }
}