import * as React from "react";

import QRCode from "qrcode.react";

import webrtc, { CallToken, ConnectionManager } from "./webrtc";
import QrScanner from "./components/QrScanner";
import Chat from "./components/Chat";

import Console from "./Console";

const console = new Console("[[App]]", 1);

export interface IProps {

}
interface IState {
    code?: string;
    connectionName?: string;
    showScanner: boolean;
    qrSize: number;
}
export default class App extends React.Component<IProps, IState> {
    public state: IState = { showScanner: true, qrSize: window.innerWidth * 0.85 };

    public async gotToken(code: string) {
        const {name, token: answer} = await webrtc.connectWithCallTokenString(code);
        if (answer) {
            this.setState({
                code: await answer.toString(),
                connectionName: name,
                showScanner: false,
            })
        }else{
            this.setState({
                connectionName: name,
                showScanner: true,
            })
        }
    }

    public async toggle() {
        if(this.state.showScanner) {
            if (!this.state.code) {
                return this.genOffer();
            }   else    {
                return new Promise( res => 
                    this.setState({
                        showScanner: false,
                    }, res)
                )
            }
        }   else    {
            return new Promise(res => 
                this.setState({
                    showScanner: true,
                }, res)
            )
        }
    }

    public async genOffer() {
        const token = await webrtc.createCallToken();
        const code = await token.toString();
        return new Promise( res => 
            this.setState({
                showScanner: false,
                code,
            }, res)
        )
    }

    public componentDidMount() {
        this.toggle();
        window.addEventListener("resize", () => {
            this.setState({
                qrSize: window.innerWidth * 0.85,
            });
        })
    }

    public render() {
        const { code, connectionName, showScanner, qrSize } = this.state;
        return <div style={{width: "100%", textAlign: "center"}}>
            {!showScanner && code && <QRCode value={code} size={qrSize}/> }
            {showScanner && <QrScanner onCode={ token => this.gotToken(token)} size={qrSize}/>}
            <br/>
            <button onClick={e => this.toggle()} style={{ fontSize: "1.5em" }}>Toggle Scanner/Code</button> 
            {!showScanner && <button onClick={e => this.genOffer()} style={{ fontSize: "1.5em" }}>New</button>}
            <Chat connectionName={connectionName}/>
        </div>
    }
}