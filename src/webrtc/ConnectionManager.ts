import IceGatherer from "./IceGatherer";
import CallToken from "./CallToken";

import Console from "../Console";

const console = new Console("[[ConnectionManager]]", 1);

export interface ChannelMessage {
    data: string;
}
export type ChannelStateMessage = { 
    evt: Event;
    state: 'open' | 'close';
} | {
    evt: ErrorEvent;
    state: 'error';
};

export default class ConnectionManager {
    private connections = new Map<string, RTCPeerConnection>();
    private channels = new Map<string, RTCDataChannel>();
    private channelDataListeners = new Map<string, (d: ChannelMessage, name: string) => void>();
    private channelStateListeners = new Map<string, (d: ChannelStateMessage, name: string) => void>();
    private iceGatherers = new Map<string, IceGatherer>();
    private pendingMessages: Record<string, string[]> = {};
    private __rtcOptions: RTCConfiguration = {};

    constructor(options: RTCConfiguration) {
        this.__rtcOptions = options;
    }

    private createConnection(name: string) {
        const connection = new RTCPeerConnection(this.__rtcOptions);
        this.pendingMessages[name] = [];
        const iceGatherer = new IceGatherer(name);
        this.iceGatherers.set(name, iceGatherer);
        connection.oniceconnectionstatechange = () => {
            console.log('ice-connection', connection.iceConnectionState);
        };
        connection.onicegatheringstatechange = () => {
            console.log(`ice-gathering-state-change:`, connection.iceGatheringState);
            if ( connection.iceGatheringState === 'complete' ) {
                iceGatherer.complete = true;
            }
        };
        connection.onnegotiationneeded = (evt) => {
            console.log(`negotiation-needed:`, evt);
        };
        connection.onsignalingstatechange = () => {
            console.log(`signaling-state-change:`, connection.signalingState);
        };
        connection.onicecandidate = evt => {
            console.log(`Ice-Candidate`, evt.candidate);
            iceGatherer.addIce(evt.candidate);
        };
        connection.ondatachannel = evt => {
            console.log(`Data-Channel`, evt.channel);
            this.saveChannel(name, evt.channel);
        };
        this.connections.set(name, connection);
        return {iceGatherer, connection};
    }

    private saveChannel(name: string, channel: RTCDataChannel) {
        channel.onmessage = evt => {
            console.log("Got Message from", name, evt);
            const cb = this.channelDataListeners.get(name);
            if ( cb ) {
                cb(evt.data as ChannelMessage, name);
            }
        };
        channel.onopen = evt => {
            console.log("Channel Open", name, evt);
            const cb = this.channelStateListeners.get(name);
            if ( cb ) {
                cb({ state: 'open', evt }, name);
            }
            if (this.pendingMessages[name].length > 0) {
                this.pendingMessages[name].forEach( msg => channel.send(msg) );
                this.pendingMessages[name] = [];
            }
        };
        channel.onclose = evt => {
            console.log("Channel Close", name, evt);
            const cb = this.channelStateListeners.get(name);
            if ( cb ) {
                cb({ state: 'close', evt }, name);
            }
        };
        channel.onerror = evt => {
            console.log("Channel Error", name, evt);
            const cb = this.channelStateListeners.get(name);
            if ( cb ) {
                cb({ state: 'error', evt }, name);
            }
        };
        this.channels.set(name, channel);
    }

    public onData(connectionName: string, cb: (d: ChannelMessage, name: string) => void) {
        this.channelDataListeners.set(connectionName, cb);
    }

    public onState(connectionName: string, cb: (d: ChannelStateMessage, name: string) => void) {
        this.channelStateListeners.set(connectionName, cb);
    }

    public async sendMessage(name: string, message: string) {
        const channel = this.channels.get(name);
        if (channel) {
            if (channel.readyState === "open") {
                channel.send(message);
            }   else    {
                console.log("Message `", message, "` has been delayed")
                this.pendingMessages[name].push(message);
            }
        }   else    {
            throw new Error('Connection does not exists');
        }
    }

    public async createCallToken(): Promise<CallToken> {
        console.log("======Token Creation====")
        const name = Date.now() + Math.random().toString(36);
        const { connection: localConnection, iceGatherer } = this.createConnection(name);
        let dc: RTCDataChannel;
        this.saveChannel(name, dc = localConnection.createDataChannel('data-channel'));
        console.log(dc);
        const offer = await localConnection.createOffer();
        await localConnection.setLocalDescription(offer);
        console.log("======Token Made====")
        return new CallToken(
            name,
            offer,
            iceGatherer,
        )
    }

    public async connectWithCallTokenString(s: string) {
        const {name, ices, session} = CallToken.parseString(s);
        console.log({
            ices
        })
        switch (session.type) {
            case 'offer': 
                const {connection: remoteConnection, iceGatherer} = this.createConnection(name);
                ices.forEach( ice => remoteConnection.addIceCandidate(ice) );
                console.log(iceGatherer);
                const offer = new RTCSessionDescription(session);
                await remoteConnection.setRemoteDescription(offer as any);
                const answer = await remoteConnection.createAnswer();
                await remoteConnection.setLocalDescription(answer);
                return {
                    name,
                    token: new CallToken(
                        name,
                        answer,
                        iceGatherer,
                    )
                };
            case 'answer':
                const localConnection = this.connections.get(name);
                if (localConnection) {
                    const ans = new RTCSessionDescription(session);
                    await localConnection.setRemoteDescription(ans as any);
                    return {
                        name,
                    };
                }   else {
                    throw Error('Answering invalid call');
                }
            default:
                throw Error('Invalid Session.type = ' + session.type);
        }
    }
}
