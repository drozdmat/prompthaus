Oto pełny plan działania w formacie Markdown, który możesz skopiować bezpośrednio do edytora, np. do Cursora. Zawiera on wszystkie etapy — od konfiguracji po dodatkowe funkcjonalności.

-----

### **Kompletny Plan Projektu Tamagotchi w TypeScript**

-----

#### **Etap 1: Konfiguracja i przygotowanie środowiska**

  - [ ] Zainstaluj **Node.js** (zalecana wersja LTS) oraz **npm**.
  - [ ] Otwórz terminal w folderze, w którym chcesz utworzyć projekt.
  - [ ] Utwórz nowy projekt za pomocą **Vite** z szablonem React + TypeScript:
      - `npm create vite@latest tamagotchi-app -- --template react-ts`
  - [ ] Przejdź do folderu projektu:
      - `cd tamagotchi-app`
  - [ ] Zainstaluj wszystkie zależności:
      - `npm install`
  - [ ] Uruchom serwer deweloperski, aby upewnić się, że środowisko działa poprawnie. Otwórz w przeglądarce adres podany w konsoli.
      - `npm run dev`
  - [ ] Zorganizuj strukturę folderów wewnątrz `src/` dla lepszej czytelności i porządku:
      - `src/components/` (na komponenty React)
      - `src/models/` (na typy i interfejsy TypeScript)
      - `src/logic/` (na logikę biznesową aplikacji)
      - `src/assets/` (na pliki statyczne, takie jak grafiki i dźwięki)

-----

#### **Etap 2: Implementacja logiki i danych (TypeScript)**

  - [ ] W `src/models/Pet.ts` zdefiniuj interfejs `Pet` z właściwościami, takimi jak:
    ```typescript
    export interface Pet {
      hunger: number;
      happiness: number;
      health: number;
      state: 'happy' | 'hungry' | 'sleeping' | 'dead';
    }
    ```
  - [ ] W `src/logic/` utwórz plik `gameEngine.ts` zawierający funkcje do modyfikacji stanu zwierzaka. Funkcje te powinny być czyste, czyli przyjmować stan zwierzaka i zwracać nowy, zmodyfikowany stan.
      - `export const feedPet = (pet: Pet): Pet => { ... };`
      - `export const playWithPet = (pet: Pet): Pet => { ... };`
      - `export const putToSleep = (pet: Pet): Pet => { ... };`
  - [ ] W pliku `src/App.tsx` zadeklaruj stan zwierzaka przy użyciu hooka `useState`:
      - `const [pet, setPet] = useState<Pet>({ hunger: 0, happiness: 100, health: 100, state: 'happy' });`
  - [ ] W tym samym pliku utwórz pętlę gry za pomocą hooka `useEffect` z `setInterval`, która będzie cyklicznie aktualizować stan zwierzaka, np. zwiększając głód.

-----

#### **Etap 3: Implementacja interfejsu użytkownika (UI)**

  - [ ] W pliku `src/index.css` dodaj globalne style, aby nadać aplikacji wygląd **retro pixel art**.
      - Ustaw stałe wymiary ekranu na **420px szerokości i 640px wysokości** dla głównego kontenera aplikacji.
      - Zastosuj właściwość CSS `image-rendering: pixelated;` na obrazach, aby zachować pikselowy wygląd.
  - [ ] Stwórz w folderze `src/components/` komponent `Screen.tsx`, który będzie wyświetlał obraz zwierzaka oraz paski stanu (głód, szczęście, zdrowie). Komponent ten powinien dynamicznie zmieniać obrazek zwierzaka w zależności od jego stanu (`pet.state`).
  - [ ] W folderze `src/components/` utwórz komponent `Buttons.tsx`. Umieść w nim trzy przyciski. Komponent powinien przyjmować funkcje z komponentu nadrzędnego (`App.tsx`) jako `props`, np. `onFeed`, `onPlay`, aby obsługiwać kliknięcia.
  - [ ] W `src/App.tsx` zaimportuj i użyj komponentów `Screen.tsx` oraz `Buttons.tsx`, przekazując im odpowiednie dane i funkcje do interakcji.
  - [ ] Znajdź lub stwórz grafiki w stylu pixel art dla różnych stanów zwierzaka (np. `happy.png`, `sad.png`, `sleeping.png`) i umieść je w folderze `src/assets/`.

-----

#### **Etap 4: Dodatkowe funkcjonalności i dopracowanie**

  - [ ] **Zapis stanu:** Zaimplementuj użycie `localStorage`, aby zapisać i wczytać stan gry. Dzięki temu zwierzak nie będzie resetowany po odświeżeniu strony.
  - [ ] **Efekty dźwiękowe:** Dodaj proste dźwięki retro do interakcji z przyciskami oraz do samej gry (np. dźwięk karmienia).
  - [ ] **Śmierć zwierzaka:** Dodaj logikę, która weryfikuje stan zwierzaka i jeśli zdrowie spadnie do zera, wyświetli odpowiednią grafikę i zablokuje interakcje.
  - [ ] **Pixelowe animacje:** Zamiast statycznych obrazków, rozważ użycie animowanych sprite sheets lub GIF-ów, aby zwierzak wydawał się bardziej żywy.

-----