module.exports = {
    // Example of a help menu given by the bot.
    // Input: none
    // Expected Return: An array of strings.
    help() {
        return [
            'Developer:',
            '/send (channel) (message) - Sends a message as the bot!'
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
            default:
                return false;
        }
    }
}