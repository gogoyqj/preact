let event = function () {
    ReactEventBridge && ReactEventBridge.apply(null, arguments);
};

export default event;
