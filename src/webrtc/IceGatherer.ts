export default class IceGatherer {
    private ices: RTCIceCandidate[] = [];
    public complete: boolean = false;

    constructor(
        public name: string
    ){}
    
    public addIce(ice: RTCIceCandidate) {
        if (!this.complete) {
            this.ices.push(ice);
        }
    }

    public awaitCompletion() : Promise<RTCIceCandidate[]> {
        return new Promise(res => {
            const intervalId = window.setInterval(() => {
                if (this.complete) {
                    window.clearInterval(intervalId);
                    res(this.ices);
                }
            }, 50)
        })
    }
}