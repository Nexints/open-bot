const calcDuration = async function (duration, unit) {
    // mute duration lol
    const durationArray = new Map([
        ['s', 1], ['m', 60], ['h', 3600], ['d', 86400],
    ]);
    let durationTotal = 0;
    if (durationArray.get(unit) !== undefined) {
        durationTotal = durationArray.get(unit) * duration;
    }
    return (durationTotal); // return in seconds
}

module.exports = {
    calcDuration,
};