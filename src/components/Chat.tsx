import * as React from "react";
import webrtc from "../webrtc";
import Console from "../Console";
import moment, { Moment } from "moment";


const console = new Console("[[Chat]]", 1);

interface ChatMessage {message: string, fromMe: boolean, time: Moment};
class ChatEntry extends React.Component<ChatMessage> {
    public render() {
        return <li>
            <b>From</b>: {this.props.fromMe ? "You" : "Them"}<br/>
            <span>{this.props.message}</span><br/>
            <i>{this.props.time.toNow()}</i>
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
                            { message: msg.data, fromMe: false, time: moment() },
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
                        { message: this.state.currentMessage, fromMe: true, time: moment() },
                    ],
                    currentMessage: "",
                })
           ])
       }    else    {
           this.setState({
               currentMessage: "",
           })
       }
    }

    public render() {
        if ( this.props.connectionName ) {
            return <div>
                <h4>Message Board: {this.props.connectionName}</h4>
                <ul>
                    {this.state.messages.map( (msg, idx) => <ChatEntry {...msg} key={idx}/> )}
                </ul>
                <form onSubmit={e => {
                    e.preventDefault();
                    this.sendMessage();
                }}>
                    <input type="text" onChange={ e => {
                        this.setState({
                            currentMessage: e.currentTarget.value,
                        })
                        console.log([e.currentTarget.value, this.state]);
                    }} value={this.state.currentMessage}/>
                    <button type="submit">Send</button>
                </form>
            </div>
        }   else    {
            return <div></div>
        }
    }
}