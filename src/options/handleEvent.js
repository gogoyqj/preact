/* global ReactEventBridge */

let handleEvent = function () {
	ReactEventBridge & ReactEventBridge.connect.apply(null, arguments);
};

export default handleEvent;
