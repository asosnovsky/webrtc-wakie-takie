import * as React from "react";

import jsQR, { QRCode } from 'jsqr';

import Console from "../Console";

const console = new Console("[[QrScanner]]", 0);

interface Point {
    x: number;
    y: number;
}
export interface IProps {
    onCode?: (t: string) => void;
    size: number;
}
export default class QrScanner extends React.Component<IProps> {

    private elmCanvas?: HTMLCanvasElement;
    private elmVideo = document.createElement('video');
    private isStopped: boolean = true;

    private get canvasCtx() {
        if (this.elmCanvas) {
            return this.elmCanvas.getContext('2d');
        }
    }

    private stopVideo() {
        this.isStopped = true;
        this.elmVideo.pause();
        if (this.elmVideo.srcObject) {
            if ( this.elmVideo.srcObject instanceof MediaStream ) {
                this.elmVideo.srcObject.getTracks().forEach( track => track.stop() );
            }   else    {
                throw new Error(`Invalid Video Type ${this.elmVideo.srcObject.constructor}`)
            }
        }
    }

    private async startVideo() {
        this.isStopped = false;
        this.elmVideo.srcObject = await navigator.mediaDevices.getUserMedia({ 
            audio: false,
            video: { facingMode: 'environment' },
        });
    }

    private async parseVideo() {
        if (this.elmVideo.readyState === this.elmVideo.HAVE_ENOUGH_DATA) {
            const canvasElement = this.elmCanvas;
            const canvas = this.canvasCtx;
            const video = this.elmVideo;
            if ( canvasElement && canvas) {
                video.height = canvasElement.height = this.props.size;
                video.width = canvasElement.width  = this.props.size;
                canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                    this.onQr(code);    
                    return;            
                }
            }
        }
        if (!this.isStopped) {
            window.requestAnimationFrame(() => {
                this.parseVideo();
            });
        }   else    {
            this.stopVideo();
        }
    }

    private drawLine(begin: Point, end: Point, color: string) {
        if (this.canvasCtx) {
            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(begin.x, begin.y);
            this.canvasCtx.lineTo(end.x, end.y);
            this.canvasCtx.lineWidth = 4;
            this.canvasCtx.strokeStyle = color;
            this.canvasCtx.stroke();
        }
    }

    private onQr(code: QRCode) {
        this.stopVideo();
        this.drawLine(code.location.topLeftCorner, code.location.topRightCorner, '#FF3B58');
        this.drawLine(code.location.topRightCorner, code.location.bottomRightCorner, '#FF3B58');
        this.drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, '#FF3B58');
        this.drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, '#FF3B58');
        try {
            if (this.props.onCode) this.props.onCode(code.data);
        } catch (error) {
            console.error(error);
            this.startVideo();
        }
    }
    
    public componentWillMount() {
        this.elmVideo.setAttribute('playsinline', 'true');
        this.elmVideo.setAttribute('autoplay', 'true');
        this.elmVideo.addEventListener('play', () => {
            window.requestAnimationFrame(() => this.parseVideo())
        })
    }

    public componentDidMount() {
        this.startVideo();
    }

    public componentWillUnmount() {
        console.log("Unmounting")
        this.stopVideo();
    }

    public render() {
        return <canvas ref={e=> e && (this.elmCanvas=e) }/>
    }
}