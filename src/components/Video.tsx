import * as React from "react";


interface IProps {
    show?: boolean;
}

export default class Video extends React.Component<IProps> {

    private elmVideo?: HTMLVideoElement;
    private streamVideo?: MediaStream;

    public componentWillMount() {
        this.componentWillReceiveProps(this.props);
    }

    public async componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.show && !this.streamVideo) {
            this.streamVideo = await window.navigator.mediaDevices.getUserMedia({
                video: true,
            })
            this.activateVideo();
        }
    }

    public activateVideo() {
        if ( this.streamVideo && this.elmVideo ) {
            this.elmVideo.srcObject = this.streamVideo;
            this.elmVideo.play();
        }
    }
    
    public componentDidMount() {
        this.activateVideo();
    }

    public render() {
        return <div>
            <video ref={ e => {
                if (e) {
                    this.elmVideo = e
                }
            }} autoPlay></video>
        </div>
    }
}