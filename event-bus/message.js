module.exports = (eventName, detail) => {
    return [
        eventName,
        {
            name: eventName,
            detail: detail,
            time: Date.now()
        }
    ]
}