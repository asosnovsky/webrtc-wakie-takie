import IceGatherer from "./IceGatherer";
import lzw from "./lzw";
import Console from "../Console";

const console = new Console("[[CallToken]]", 0);

function pad(num: number, width: number, z: string = '0') {
    const n = num + '';
    if (n.length < width)   {
        return new Array(width - n.length + 1).join(z) + n;
    }   else if (n.length === width)  {
        return n;
    }   else    {
        throw Error(`"number".length > width = ${n.length} > ${width} | "number"=${n}`);
    }
}

export default class CallToken {
    constructor(
        public name: string, 
        public session: RTCSessionDescriptionInit,
        private ice: IceGatherer,
    ) {}
    public get type(){
        return this.session.type;
    }
    public async toString(): Promise<string> {
        const ices = await this.ice.awaitCompletion();
        const icesString = pad(ices.length, 3) + ices.reduce( (s, ice) => {
            return s + pad(String(ice.candidate).length, 3) + String(ice.candidate) + 
                        pad(String(ice.sdpMid).length, 2) + String(ice.sdpMid) + 
                        pad(String(ice.sdpMLineIndex).length, 2) + String(ice.sdpMLineIndex); 
        } , "");
        const n = pad(this.name.length, 2);
        const sdp = String(this.session.sdp);
        const sdpLength = sdp.length;
        switch (this.session.type) {
            case 'answer':
                return lzw.encode(`${n}${this.name}A${sdpLength}${sdp}I${icesString}`);
            case 'offer':
                return lzw.encode(`${n}${this.name}O${sdpLength}${sdp}I${icesString}`);
            default:
                throw Error('Invalid CallToken.type');
        }
    }
    private static parseAllIces(s: string, count: number) {
        let remainingStr = s;
        let idx = 0;
        const ices:RTCIceCandidate[] = [];

        while ( remainingStr.length > 0 && idx < 1000 ) {
            const candidateSize = parseInt(remainingStr.substr(0, 3));
            const candidate = remainingStr.substr(3 , candidateSize);
            remainingStr = remainingStr.substr(3 + candidateSize);

            const sdpMidLength = parseInt(remainingStr.substr(0, 2));
            const sdpMid = remainingStr.substr(2 , sdpMidLength);
            remainingStr = remainingStr.substr(2 + sdpMidLength);

            const sdpMLineIndexLength = parseInt(remainingStr.substr(0, 2));
            const sdpMLineIndex = parseInt(remainingStr.substr(2 , sdpMLineIndexLength));
            remainingStr = remainingStr.substr(2 + sdpMLineIndexLength);

            ices.push(new RTCIceCandidate({
                candidate,
                sdpMid,
                sdpMLineIndex,
            }))

            idx ++;
        }
        if (ices.length === count) {
            return ices;
        }   else    {
            throw Error(`Missing or invalid number of candidates, expecting ${count} getting ${ices.length}`);
        }
    }
    public static parseString(encodedStr: string) : { name: string; ices: RTCIceCandidate[]; session: RTCSessionDescriptionInit } {
        const s = lzw.decode(encodedStr);
        const n = Number(s.substr(0, 2));
        const name = s.substr(2, n);
        const type = s.substr(2 + n, 1);
        const sdpLength = parseInt(s.substr(2 + n + 1, 3))
        const sdp = s.substr(2 + n + 1 + 3, sdpLength);
        const icesCount = parseInt(s.substr(2 + n + 1 + 3 + sdpLength + 1, 3));
        const ices = CallToken.parseAllIces(s.substr(2 + n + 1 + 3 + sdpLength + 1 + 3), icesCount);
        let token: CallToken;
        switch (type) {
            case 'A':
                return {
                    name, 
                    ices,
                    session: {
                        type: 'answer',
                        sdp,
                    },
                }
            case 'O':
                return {
                    name, 
                    ices,
                    session: {
                        type: 'offer',
                        sdp,
                    },
                };
            default:
                throw new Error('Invalid token.type');
        }
    }
}