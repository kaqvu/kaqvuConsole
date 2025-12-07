const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 8080;

class BotManager {
    constructor(io) {
        this.io = io;
        this.botsDir = path.join(__dirname, 'bots');
        this.bots = {};
        this.activeBots = {};
        this.logsModes = {};
        
        if (!fs.existsSync(this.botsDir)) {
            fs.mkdirSync(this.botsDir);
        }
        
        this.loadBots();
    }
    
    log(message, socketId = null) {
        if (socketId) {
            this.io.to(socketId).emit('log', message);
        } else {
            this.io.emit('log', message);
        }
    }
    
    loadBots() {
        const files = fs.readdirSync(this.botsDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const data = fs.readFileSync(path.join(this.botsDir, file), 'utf8');
                const botData = JSON.parse(data);
                this.bots[botData.name] = botData;
            }
        }
    }
    
    saveBot(botData) {
        const filePath = path.join(this.botsDir, `${botData.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(botData, null, 2));
    }
    
    createBot(name, server, version) {
        if (this.bots[name]) {
            this.log(`Bot o nazwie '${name}' juz istnieje!`);
            return false;
        }
        
        const parts = server.split(':');
        let host, port;
        
        if (parts.length === 1) {
            host = parts[0];
            port = 25565;
        } else if (parts.length === 2) {
            host = parts[0];
            port = parseInt(parts[1]);
        } else {
            this.log('Nieprawidlowy format serwera! Uzyj: ip:port lub ip');
            return false;
        }
        
        const botData = {
            name: name,
            host: host,
            port: port,
            version: version
        };
        
        this.bots[name] = botData;
        this.saveBot(botData);
        this.log(`Utworzono bota: ${name}`);
        this.io.emit('botList', this.getBotsList());
        return true;
    }
    
    startBot(name) {
        if (!this.bots[name]) {
            this.log(`Bot '${name}' nie istnieje!`);
            return false;
        }
        
        if (this.activeBots[name]) {
            this.log(`Bot '${name}' juz dziala!`);
            return false;
        }
        
        const botData = this.bots[name];
        
        try {
            const bot = mineflayer.createBot({
                host: botData.host,
                port: botData.port,
                username: name,
                version: botData.version,
                hideErrors: true
            });
            
            this.activeBots[name] = bot;
            
            bot.on('login', () => {
                this.log(`[${name}] Bot zalogowany na serwer!`);
                this.io.emit('botList', this.getBotsList());
            });
            
            bot.on('spawn', () => {
                this.log(`[${name}] Bot zespawnowany w grze!`);
            });
            
            bot.on('kicked', (reason) => {
                this.log(`[${name}] Wyrzucono z serwera: ${reason}`);
                delete this.activeBots[name];
                this.io.emit('botList', this.getBotsList());
            });
            
            bot.on('end', () => {
                this.log(`[${name}] Polaczenie zakonczone`);
                delete this.activeBots[name];
                this.io.emit('botList', this.getBotsList());
            });
            
            bot.on('error', (err) => {
                if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
                    return;
                }
                this.log(`[${name}] ERROR: ${err.message}`);
            });
            
            bot.on('messagestr', (message) => {
                for (const socketId in this.logsModes) {
                    if (this.logsModes[socketId] === name) {
                        this.log(`[SERVER] ${message}`, socketId);
                    }
                }
            });
            
            this.log(`Uruchomiono bota: ${name}`);
            this.io.emit('botList', this.getBotsList());
            return true;
        } catch (err) {
            this.log(`Blad podczas uruchamiania bota: ${err.message}`);
            return false;
        }
    }
    
    stopBot(name) {
        if (!this.activeBots[name]) {
            this.log(`Bot '${name}' nie jest uruchomiony!`);
            return false;
        }
        
        this.activeBots[name].quit();
        delete this.activeBots[name];
        this.log(`Zatrzymano bota: ${name}`);
        this.io.emit('botList', this.getBotsList());
        return true;
    }
    
    deleteBot(name) {
        if (!this.bots[name]) {
            this.log(`Bot '${name}' nie istnieje!`);
            return false;
        }
        
        if (this.activeBots[name]) {
            this.stopBot(name);
        }
        
        const jsonPath = path.join(this.botsDir, `${name}.json`);
        if (fs.existsSync(jsonPath)) {
            fs.unlinkSync(jsonPath);
        }
        
        delete this.bots[name];
        this.log(`Usunieto bota: ${name}`);
        this.io.emit('botList', this.getBotsList());
        return true;
    }
    
    getBotsList() {
        const botsList = [];
        for (const name in this.bots) {
            botsList.push({
                name: name,
                status: this.activeBots[name] ? 'DZIALA' : 'ZATRZYMANY'
            });
        }
        return botsList;
    }
    
    enterLogs(socketId, botName) {
        if (!this.activeBots[botName]) {
            this.log(`Bot '${botName}' nie jest uruchomiony!`, socketId);
            return false;
        }
        
        this.logsModes[socketId] = botName;
        this.log(`\n${'='.repeat(50)}`, socketId);
        this.log(`LOGI BOTA: ${botName}`, socketId);
        this.log(`Wpisz '.exit' aby wyjsc z logow`, socketId);
        this.log(`Wpisz wiadomosc aby wyslac na chat`, socketId);
        this.log(`${'='.repeat(50)}\n`, socketId);
        this.io.to(socketId).emit('logsMode', true);
        return true;
    }
    
    exitLogs(socketId) {
        const botName = this.logsModes[socketId];
        if (botName) {
            delete this.logsModes[socketId];
            this.log(`\nWychodzenie z logow bota ${botName}...\n`, socketId);
        }
        this.io.to(socketId).emit('logsMode', false);
    }
    
    sendMessage(socketId, message) {
        const botName = this.logsModes[socketId];
        if (!botName) {
            return false;
        }
        
        if (!this.activeBots[botName]) {
            this.log(`Bot '${botName}' nie jest uruchomiony!`, socketId);
            return false;
        }
        
        try {
            this.activeBots[botName].chat(message);
            if (message.startsWith('/')) {
                this.log(`[CMD] ${message}`, socketId);
            } else {
                this.log(`[SEND] ${message}`, socketId);
            }
            return true;
        } catch (err) {
            this.log(`[ERROR] Nie mozna wyslac: ${err.message}`, socketId);
            return false;
        }
    }
}

const manager = new BotManager(io);

app.use(express.static('web'));

io.on('connection', (socket) => {
    console.log('Nowy klient polaczony');
    
    socket.on('getInitialData', () => {
        socket.emit('log', 'kaqvuNodeBot - Web Interface');
        socket.emit('log', '');
        socket.emit('botList', manager.getBotsList());
    });
    
    socket.on('command', (command) => {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        
        if (!cmd) return;
        
        socket.emit('log', `> ${command}`);
        
        if (cmd === 'create') {
            if (parts.length !== 4) {
                socket.emit('log', 'Uzycie: create <nazwa> <ip[:port]> <wersja>');
            } else {
                manager.createBot(parts[1], parts[2], parts[3]);
            }
        } else if (cmd === 'start') {
            if (parts.length !== 2) {
                socket.emit('log', 'Uzycie: start <nazwa>');
            } else {
                manager.startBot(parts[1]);
            }
        } else if (cmd === 'stop') {
            if (parts.length !== 2) {
                socket.emit('log', 'Uzycie: stop <nazwa>');
            } else {
                manager.stopBot(parts[1]);
            }
        } else if (cmd === 'delete') {
            if (parts.length !== 2) {
                socket.emit('log', 'Uzycie: delete <nazwa>');
            } else {
                manager.deleteBot(parts[1]);
            }
        } else if (cmd === 'logs') {
            if (parts.length !== 2) {
                socket.emit('log', 'Uzycie: logs <nazwa>');
            } else {
                manager.enterLogs(socket.id, parts[1]);
            }
        } else if (cmd === 'list') {
            const count = Object.keys(manager.bots).length;
            socket.emit('log', `Utworzone boty: ${count}`);
            if (count > 0) {
                for (const name in manager.bots) {
                    const status = manager.activeBots[name] ? 'DZIALA' : 'ZATRZYMANY';
                    socket.emit('log', `  - ${name} [${status}]`);
                }
            }
        } else if (cmd === 'clear') {
            socket.emit('clearConsole');
            socket.emit('log', 'kaqvuNodeBot - Web Interface');
            socket.emit('log', '');
        } else if (cmd === 'help') {
            socket.emit('log', 'Komendy:');
            socket.emit('log', '  create <nazwa> <ip[:port]> <wersja>');
            socket.emit('log', '  start <nazwa>');
            socket.emit('log', '  stop <nazwa>');
            socket.emit('log', '  delete <nazwa>');
            socket.emit('log', '  logs <nazwa>');
            socket.emit('log', '  list');
            socket.emit('log', '  clear');
            socket.emit('log', '  help');
        } else {
            socket.emit('log', 'Nieznana komenda!');
        }
    });
    
    socket.on('logsMessage', (message) => {
        const trimmed = message.trim();
        
        if (trimmed === '.exit') {
            manager.exitLogs(socket.id);
        } else if (trimmed) {
            manager.sendMessage(socket.id, trimmed);
        }
    });
    
    socket.on('disconnect', () => {
        if (manager.logsModes[socket.id]) {
            delete manager.logsModes[socket.id];
        }
        console.log('Klient rozlaczony');
    });
});

server.listen(PORT, () => {
    console.log(`\nkaqvuNodeBot - Web Interface`);
    console.log(`Server dziala na http://localhost:${PORT}`);
    console.log(`Otwórz przegladarke i przejdz do tego adresu\n`);
});