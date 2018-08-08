import * as React from "react";

import QRCode from "qrcode.react";

import webrtc, { CallToken, ConnectionManager } from "./webrtc";
import QrScanner from "./components/QrScanner";
import Chat from "./components/Chat";

import Console from "./Console";

const console = new Console("[[App]]", 0);

export interface IProps {

}
interface IState {
    code?: string;
    connectionName?: string;
    showScanner: boolean;
}
export default class App extends React.Component<IProps, IState> {
    public state: IState = { showScanner: true };

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
            const token = await webrtc.createCallToken();
            const code = await token.toString();
            this.setState({
                showScanner: false,
                code,
            })
        }   else    {
            this.setState({
                showScanner: true,
                code: undefined,
            });
        }
    }

    public componentDidMount() {
        this.toggle();
        this.setState({
            showScanner: false,
        })
    }

    public render() {
        const { code, connectionName, showScanner } = this.state;
        const qrSize = window.outerWidth * 0.85;
        return <div>
            {code && <QRCode value={code} size={qrSize}/> }
            {showScanner && <QrScanner onCode={ token => this.gotToken(token)}/>}
            <br/>
            <button onClick={e => this.toggle()}>Toggle Scanner</button>
            <Chat connectionName={connectionName}/>
        </div>
    }
}