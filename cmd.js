const mineflayer = require('mineflayer');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class BotManager {
    constructor() {
        this.botsDir = path.join(__dirname, 'bots');
        this.bots = {};
        this.processes = {};
        this.activeBots = {};
        
        if (!fs.existsSync(this.botsDir)) {
            fs.mkdirSync(this.botsDir);
        }
        
        this.loadBots();
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
            console.log(`Bot o nazwie '${name}' juz istnieje!`);
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
            console.log('Nieprawidlowy format serwera! Uzyj: ip:port lub ip');
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
        console.log(`Utworzono bota: ${name}`);
        return true;
    }
    
    startBot(name) {
        if (!this.bots[name]) {
            console.log(`Bot '${name}' nie istnieje!`);
            return false;
        }
        
        if (this.activeBots[name]) {
            console.log(`Bot '${name}' juz dziala!`);
            return false;
        }
        
        const botData = this.bots[name];
        
        try {
            const bot = mineflayer.createBot({
                host: botData.host,
                port: botData.port,
                username: name,
                version: botData.version,
                hideErrors: false
            });
            
            this.activeBots[name] = bot;
            
            bot.on('login', () => {
                console.log(`[${name}] Bot zalogowany na serwer!`);
            });
            
            bot.on('spawn', () => {
                console.log(`[${name}] Bot zespawnowany w grze!`);
            });
            
            bot.on('kicked', (reason) => {
                console.log(`[${name}] Wyrzucono z serwera: ${reason}`);
                delete this.activeBots[name];
            });
            
            bot.on('end', () => {
                console.log(`[${name}] Polaczenie zakonczone`);
                delete this.activeBots[name];
            });
            
            bot.on('error', (err) => {
                console.error(`[${name}] ERROR: ${err.message}`);
            });
            
            console.log(`Uruchomiono bota: ${name}`);
            return true;
        } catch (err) {
            console.error(`Blad podczas uruchamiania bota: ${err.message}`);
            return false;
        }
    }
    
    stopBot(name) {
        if (!this.activeBots[name]) {
            console.log(`Bot '${name}' nie jest uruchomiony!`);
            return false;
        }
        
        this.activeBots[name].quit();
        delete this.activeBots[name];
        console.log(`Zatrzymano bota: ${name}`);
        return true;
    }
    
    deleteBot(name) {
        if (!this.bots[name]) {
            console.log(`Bot '${name}' nie istnieje!`);
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
        console.log(`Usunieto bota: ${name}`);
        return true;
    }
    
    listBots() {
        const count = Object.keys(this.bots).length;
        console.log(`\nUtworzone boty: ${count}`);
        
        if (count > 0) {
            for (const name in this.bots) {
                const status = this.activeBots[name] ? 'DZIALA' : 'ZATRZYMANY';
                console.log(`  - ${name} [${status}]`);
            }
        }
        console.log();
    }
    
    async viewLogs(name, mainRl) {
        if (!this.activeBots[name]) {
            console.log(`Bot '${name}' nie jest uruchomiony!`);
            return false;
        }
        
        const bot = this.activeBots[name];
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`LOGI BOTA: ${name}`);
        console.log(`Wpisz '.exit' aby wyjsc z logow`);
        console.log(`Wpisz wiadomosc aby wyslac na chat`);
        console.log(`${'='.repeat(50)}\n`);
        
        let lastMessage = '';
        let lastMessageTime = 0;
        
        const messageHandler = (message) => {
            const now = Date.now();
            if (message === lastMessage && (now - lastMessageTime) < 3000) {
                return;
            }
            lastMessage = message;
            lastMessageTime = now;
            console.log(`[SERVER] ${message}`);
        };
        
        bot.on('messagestr', messageHandler);
        
        mainRl.removeAllListeners('line');
        
        return new Promise((resolve) => {
            const lineHandler = (line) => {
                const trimmed = line.trim();
                
                if (trimmed === '.exit') {
                    console.log(`\nWychodzenie z logow bota ${name}...\n`);
                    bot.removeListener('messagestr', messageHandler);
                    mainRl.removeListener('line', lineHandler);
                    resolve(true);
                    return;
                }
                
                if (trimmed && this.activeBots[name]) {
                    try {
                        bot.chat(trimmed);
                        if (trimmed.startsWith('/')) {
                            console.log(`[CMD] ${trimmed}`);
                        } else {
                            console.log(`[SEND] ${trimmed}`);
                        }
                    } catch (err) {
                        console.error(`[ERROR] Nie mozna wyslac: ${err.message}`);
                    }
                }
            };
            
            mainRl.on('line', lineHandler);
        });
    }
}

async function main() {
    const manager = new BotManager();
    
    console.log('\nkaqvuNodeBot');
    manager.listBots();
    
    console.log('Komendy:');
    console.log('  create <nazwa> <ip[:port]> <wersja>');
    console.log('  start <nazwa>');
    console.log('  stop <nazwa>');
    console.log('  delete <nazwa>');
    console.log('  logs <nazwa>');
    console.log('  list');
    console.log('  clear');
    console.log('  help');
    console.log('  exit');
    console.log();
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });
    
    rl.prompt();
    
    const setupMainMenu = () => {
        rl.removeAllListeners('line');
        
        rl.on('line', async (line) => {
            const parts = line.trim().split(/\s+/);
            const cmd = parts[0].toLowerCase();
            
            if (!cmd) {
                rl.prompt();
                return;
            }
            
            if (cmd === 'exit') {
                for (const name in manager.activeBots) {
                    manager.stopBot(name);
                }
                console.log('Do widzenia!');
                process.exit(0);
            } else if (cmd === 'create') {
                if (parts.length !== 4) {
                    console.log('Uzycie: create <nazwa> <ip:port> <wersja>');
                } else {
                    manager.createBot(parts[1], parts[2], parts[3]);
                }
            } else if (cmd === 'start') {
                if (parts.length !== 2) {
                    console.log('Uzycie: start <nazwa>');
                } else {
                    manager.startBot(parts[1]);
                }
            } else if (cmd === 'stop') {
                if (parts.length !== 2) {
                    console.log('Uzycie: stop <nazwa>');
                } else {
                    manager.stopBot(parts[1]);
                }
            } else if (cmd === 'delete') {
                if (parts.length !== 2) {
                    console.log('Uzycie: delete <nazwa>');
                } else {
                    manager.deleteBot(parts[1]);
                }
            } else if (cmd === 'logs') {
                if (parts.length !== 2) {
                    console.log('Uzycie: logs <nazwa>');
                } else {
                    await manager.viewLogs(parts[1], rl);
                    setupMainMenu();
                }
            } else if (cmd === 'list') {
                manager.listBots();
            } else if (cmd === 'clear') {
                console.clear();
                console.log('\nkaqvuNodeBot');
                manager.listBots();
            } else if (cmd === 'help') {
                console.log('\nKomendy:');
                console.log('  create <nazwa> <ip[:port]> <wersja>');
                console.log('  start <nazwa>');
                console.log('  stop <nazwa>');
                console.log('  delete <nazwa>');
                console.log('  logs <nazwa>');
                console.log('  list');
                console.log('  clear');
                console.log('  help');
                console.log('  exit');
                console.log();
            } else {
                console.log('Nieznana komenda!');
            }
            
            rl.prompt();
        });
    };
    
    setupMainMenu();
    
    rl.on('close', () => {
        for (const name in manager.activeBots) {
            manager.stopBot(name);
        }
        console.log('\nDo zobaczenia!');
        process.exit(0);
    });
}

main().catch(err => {
    console.error('Blad:', err);
    process.exit(1);
});