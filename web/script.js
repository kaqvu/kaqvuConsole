const socket = io();
const consoleEl = document.getElementById('console');
const commandInput = document.getElementById('commandInput');
const botsListEl = document.getElementById('botsList');
let logsMode = false;

socket.on('log', (message) => {
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = message;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
});

socket.on('botList', (bots) => {
    botsListEl.innerHTML = '';
    if (bots.length === 0) {
        botsListEl.innerHTML = '<div style="color: #858585;">Brak botow</div>';
    } else {
        bots.forEach(bot => {
            const botEl = document.createElement('div');
            botEl.className = 'bot-item' + (bot.status === 'DZIALA' ? ' active' : '');
            botEl.innerHTML = `
                <div class="bot-name">${bot.name}</div>
                <div class="bot-status ${bot.status === 'DZIALA' ? 'active' : ''}">${bot.status}</div>
            `;
            botsListEl.appendChild(botEl);
        });
    }
});

socket.on('logsMode', (isLogsMode) => {
    logsMode = isLogsMode;
    if (isLogsMode) {
        commandInput.placeholder = 'Wpisz wiadomosc lub .exit...';
    } else {
        commandInput.placeholder = 'Wpisz komende...';
    }
});

socket.on('clearConsole', () => {
    consoleEl.innerHTML = '';
});

function sendCommand() {
    const command = commandInput.value.trim();
    if (command) {
        if (logsMode) {
            socket.emit('logsMessage', command);
        } else {
            socket.emit('command', command);
        }
        commandInput.value = '';
    }
}

commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendCommand();
    }
});

socket.emit('getInitialData');