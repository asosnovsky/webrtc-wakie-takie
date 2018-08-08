declare module "qrcode.react" {
    import { Component } from "react";
    export interface IProps {
        value       : string;	
        renderAs?   : 'canvas' | 'svg'; //default canvas
        size?       : number; //default	128
        bgColor?    : string; //default "#FFFFFF"
        fgColor?    : string; //default "#000000"
        level?      : 'L' | 'M' | 'Q' | 'H'; //default 'L'
        style?      : React.CSSProperties;
    }
    export default class extends Component<IProps> {}
}