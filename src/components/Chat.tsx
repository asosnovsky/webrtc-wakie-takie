import * as React from "react";
import webrtc from "../webrtc";
import Console from "../Console";

const console = new Console("[[Chat]]", 0);

interface ChatMessage {message: string, fromMe: boolean};
class ChatEntry extends React.Component<ChatMessage> {
    public render() {
        return <li>
            <b>From</b>: {this.props.fromMe ? "You" : "Them"}<br/>
            <span>{this.props.message}</span>
        </li>
    }
}

export interface IProps {
    connectionName?: string;
}
interface IState {
    currentMessage: string;
    messages: ChatMessage[];
}
export default class extends React.Component<IProps, IState> {
    public state: IState = { currentMessage: "", messages: [], }

    public componentWillReceiveProps({ connectionName } : IProps) {
        if (connectionName) {
            webrtc.onData(connectionName, (msg, name) => {
                if ( connectionName === name ) {
                    this.setState({
                        messages: [
                            ...this.state.messages,
                            { message: msg.data, fromMe: false },
                        ]
                    })
                } 
            })
        }
    }

    public async sendMessage() {
       if (this.props.connectionName) {
            return Promise.all([
                webrtc.sendMessage(this.props.connectionName, this.state.currentMessage),
                this.setState({
                    messages: [
                        ...this.state.messages,
                        { message: this.state.currentMessage, fromMe: true },
                    ],
                    currentMessage: "",
                })
           ])
       }
    }

    public render() {
        return <div>
            <h4>Message Board: {this.props.connectionName}</h4>
            <ul>
                {this.state.messages.map( (msg, idx) => <ChatEntry {...msg} key={idx}/> )}
            </ul>
            <form onSubmit={e => {
                e.preventDefault();
                this.sendMessage();
            }}>
                <input type="text" onKeyDown={ e => {
                    this.setState({
                        currentMessage: e.currentTarget.value,
                    })
                }}/>
                <button type="submit">Send</button>
            </form>
        </div>
    }
}