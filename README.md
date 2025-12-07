# 🤖 kaqvuNodeBot

System zarządzania botami Minecraft napisany w Node.js z wykorzystaniem biblioteki Mineflayer.

## 📋 Opis

kaqvuNodeBot to zaawansowany system do zarządzania wieloma botami Minecraft jednocześnie. Umożliwia tworzenie, uruchamianie i kontrolowanie botów zarówno przez interfejs konsolowy, jak i przez nowoczesny interfejs webowy.

## ✨ Funkcje

- 🎮 **Zarządzanie wieloma botami** - Twórz i zarządzaj nieograniczoną liczbą botów
- 💻 **Interfejs konsolowy** - Pełna kontrola przez terminal/CMD
- 🌐 **Interfejs webowy** - Nowoczesny panel webowy z komunikacją w czasie rzeczywistym
- 📝 **System logów** - Przeglądaj wiadomości z serwera i wysyłaj komendy
- 💾 **Trwałe przechowywanie** - Wszystkie boty są zapisywane i ładowane automatycznie
- 🔄 **Obsługa wielu wersji** - Wsparcie dla różnych wersji Minecraft

## 🚀 Instalacja

1. Sklonuj repozytorium lub pobierz pliki
2. Zainstaluj zależności:

```bash
npm install
```

3. (Opcjonalnie) Utwórz plik `.env` i ustaw port dla interfejsu webowego:

```env
PORT=8080
```

## 📦 Wymagania

- Node.js (wersja 14 lub nowsza)
- npm lub yarn

## 🎯 Użycie

### Interfejs konsolowy

Uruchom standardowy interfejs w terminalu:

```bash
npm start
```

### Interfejs webowy

Uruchom interfejs webowy:

```bash
npm run web
```

Następnie otwórz przeglądarkę i przejdź do `http://localhost:8080`

## 📖 Komendy

### Zarządzanie botami

- `create <nazwa> <ip[:port]> <wersja>` - Tworzy nowego bota (port opcjonalny, domyślnie 25565)
- `start <nazwa>` - Uruchamia bota
- `stop <nazwa>` - Zatrzymuje bota
- `delete <nazwa>` - Usuwa bota
- `list` - Wyświetla listę wszystkich botów

### Przeglądanie logów

- `logs <nazwa>` - Wchodzi w tryb logów dla danego bota
- `.exit` - Wychodzi z trybu logów (tylko w trybie logów)

### Inne

- `clear` - Czyści konsolę
- `help` - Wyświetla pomoc
- `exit` - Zamyka aplikację (tylko w trybie konsolowym)

## 💡 Przykłady użycia

### Tworzenie i uruchamianie bota

```bash
> create mojBot hypixel.net:25565 1.8.9
Utworzono bota: mojBot

> start mojBot
Uruchomiono bota: mojBot
[mojBot] Bot zalogowany na serwer!
[mojBot] Bot zespawnowany w grze!
```

### Tworzenie bota z domyślnym portem

Jeśli nie podasz portu, automatycznie zostanie użyty domyślny port **25565**:

```bash
> create mojBot2 localhost 1.8.9
Utworzono bota: mojBot2
```

To jest równoznaczne z:

```bash
> create mojBot2 localhost:25565 1.8.9
```

### Przeglądanie logów i wysyłanie komend

```bash
> logs mojBot
==================================================
LOGI BOTA: mojBot
Wpisz '.exit' aby wyjsc z logow
Wpisz wiadomosc aby wyslac na chat
==================================================

[SERVER] Witaj na serwerze!
/login mojehaslo
[CMD] /login mojehaslo
[SERVER] Zalogowano pomyślnie!
.exit

Wychodzenie z logow bota mojBot...
```

## 📁 Struktura projektu

```
kaqvuNodeBot/
├── server.js           # Interfejs konsolowy
├── web.js             # Interfejs webowy
├── package.json       # Konfiguracja projektu
├── .env              # Konfiguracja (opcjonalnie)
├── bots/             # Folder z zapisanymi botami (tworzony automatycznie)
│   ├── bot1.json
│   ├── bot2.json
│   └── ...
└── README.md         # Ten plik
```

## 🔧 Konfiguracja

### Plik .env

Możesz utworzyć plik `.env` w głównym katalogu projektu:

```env
PORT=8080
```

Jeśli plik `.env` nie istnieje, domyślny port to `8080`.

## 🌐 Interfejs webowy

Interfejs webowy oferuje:

- 📊 Panel boczny z listą wszystkich botów i ich statusami
- 💬 Konsolę wyświetlającą logi w czasie rzeczywistym
- ⌨️ Pole do wpisywania komend
- 🎨 Ciemny motyw w stylu VS Code
- 🔄 Automatyczne odświeżanie listy botów

## ⚠️ Uwagi

- Boty są zapisywane w folderze `bots/` jako pliki JSON
- Każdy bot wymaga unikalnej nazwy
- Format serwera: `ip:port` lub samo `ip` (domyślny port to **25565**)
- Wersja musi być kompatybilna z Mineflayer (np. `1.8.9`, `1.16.5`, `1.19.4`)
- W trybie logów wszystkie wiadomości są wysyłane bezpośrednio na chat bota

## 🐛 Rozwiązywanie problemów

### Bot się nie łączy

- Sprawdź czy adres IP i port są poprawne
- Upewnij się, że wersja jest zgodna z serwerem
- Sprawdź czy serwer jest online

### Błąd przy instalacji

- Upewnij się, że masz zainstalowane Node.js (wersja 14+)
- Spróbuj usunąć folder `node_modules` i plik `package-lock.json`, a następnie uruchom `npm install` ponownie

### Interfejs webowy nie działa

- Sprawdź czy port nie jest zajęty przez inną aplikację
- Zmień port w pliku `.env`
- Upewnij się, że wszystkie zależności zostały zainstalowane

## 👤 Autor

kaqvu

---

**Uwaga:** Ten projekt jest przeznaczony wyłącznie do celów edukacyjnych i testowych. Upewnij się, że używanie botów jest zgodne z regulaminem serwera, na którym je uruchamiasz.