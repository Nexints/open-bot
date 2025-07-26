const { version, versionID } = require('./../../config.js');
const { latestVersion } = require('./../../index.js');

module.exports = {
    // Example of a help menu given by the bot.
    // Input: none
    // Expected Return: An array of strings.
    help() {
        return [
            'Developer:',
            '/send (channel) (msg) - Sends a message as the bot!',
            '/print (args) - Prints stuff to the console!',
        ];
    },
    // Example of a command in the CLI (command line) of the bot.
    // Input: command given by the bot, readline function, client
    // Expected Return: true or false depending on if the command was valid or not. Otherwise, this breaks the code used to determine if a command is valid or not.
    async command(command) {
        switch (command.split(" ")[0].toLowerCase()) {
            case "/send": // A way to send messages to specific channels or users as the bot!
                let channel;
                try {
                    channel = await client.channels.fetch(command.split(" ")[1]);
                } catch {
                    console.log("[" + new Date().toLocaleTimeString() + '] [WARN] Channel is not a valid channel.');
                    return true;
                }
                let sentMessage = "";
                for (let i = 2; i < command.split(" ").length; i++) {
                    sentMessage = sentMessage + command.split(" ")[i] + " ";
                }
                channel.send(sentMessage);
                console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Sent ${sentMessage} as the bot!`);
                return true;
            case "/print": // Prints various things. This mostly serves as a developer command.
                let print;
                if (command.split(" ")[1] != undefined) {
                    print = command.split(" ")[1].toLowerCase();
                }
                switch (print) {
                    case 'version':
                        console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Printing the version`);
                        console.log("[" + new Date().toLocaleTimeString() + `] [INFO] ${version} (${versionID}) / Latest version ID: ${latestVersion}.`);
                        if(latestVersion > versionID){
                            console.log("[" + new Date().toLocaleTimeString() + `] [INFO] ${latestVersion - versionID} commits behind.`);
                        }else{
                            console.log("[" + new Date().toLocaleTimeString() + `] [INFO] ${versionID - latestVersion} commits ahead.`);
                        }
                        break;
                    default:
                        console.log("[" + new Date().toLocaleTimeString() + `] [WARN] Not a valid argument.`);
                        console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Valid arguments:`);
                        console.log("[" + new Date().toLocaleTimeString() + `] [INFO] version - prints version info`);
                }
                return true;
            default:
                return false;
        }
    }
}