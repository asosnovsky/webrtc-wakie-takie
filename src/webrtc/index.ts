import ConnectionManager from './ConnectionManager';
import CallToken from './CallToken';

export {
    ConnectionManager,
    CallToken,
};

export default new ConnectionManager({
    "iceServers": [
        {
            "urls": [
                "stun:stun.l.google.com:19302"
            ]
        }
    ],
});
