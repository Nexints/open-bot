// config file for currency

module.exports = {
    config() {}, // make the index.js file ignore this file for configs
    jobs: [
        {
            name: "Cleaner", // name
            credit: "popeyes", // credit the person who came up with the idea
            wage: 10000, // wage, +=50%
            maxDays: 7, // max days before ur fired
            promo: 14, // after how many work times
            promoAmount: 1.2, // promotion amount
            chance: 50 // chance
        },
        {
            name: "Photographer",
            credit: "Mistie",
            wage: 20000,
            maxDays: 14,
            promo: 14,
            promoAmount: 1.2,
            chance: 15
        },
        {
            name: "Actor",
            credit: "Shizunyan",
            wage: 100000,
            maxDays: 3,
            promo: 30,
            promoAmount: 1.2,
            chance: 2
        },
        {
            name: "Artist",
            credit: "Shizunyan",
            wage: 2500,
            maxDays: 28,
            promo: 14,
            promoAmount: 1.1,
            chance: 30
        },
        {
            name: "Dancer",
            credit: "Shizunyan",
            wage: 5000,
            maxDays: 4,
            promo: 14,
            promoAmount: 1.2,
            chance: 20
        },
        {
            name: "Engineer",
            credit: "Shizunyan",
            wage: 50000,
            maxDays: 1,
            promo: 21,
            promoAmount: 1.2,
            chance: 7
        },
        {
            name: "Director",
            credit: "Shizunyan",
            wage: 75000,
            maxDays: 1,
            promo: 28,
            promoAmount: 1.3,
            chance: 5
        },
        {
            name: "Singer",
            credit: "Shizunyan",
            wage: 25000,
            maxDays: 14,
            promo: 14,
            promoAmount: 1.5,
            chance: 30
        },
        {
            name: "Tech Support",
            credit: "Popeyes",
            wage: 7500,
            maxDays: 14,
            promo: 7,
            promoAmount: 1.5,
            chance: 30
        },
        {
            name: "Pilot",
            credit: "Popeyes",
            wage: 150000,
            maxDays: 1,
            promo: 7,
            promoAmount: 1.2,
            chance: 4
        },
        {
            name: "Discord Mod",
            credit: "Kira",
            wage: 0,
            maxDays: 2147483648,
            promo: 1,
            promoAmount: 0.001,
            chance: 1
        },
    ],
    choiceCount: 3, // how many job choices in /apply command
    expChance: 0.5, // exp gain chance (0 - 1)
    expMaxGain: 5, // how much exp to gain (max)
}

