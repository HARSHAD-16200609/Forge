"use client";
import { useState, useEffect, useRef } from "react";

// --- ICONS (No external packages needed) ---
const SearchIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);
const MicIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
);
const XIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);
const ClockIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);
const SmileIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" x2="9.01" y1="9" y2="9" />
        <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
);
const CatIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
        <path d="M8 14v.5" />
        <path d="M16 14v.5" />
        <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
    </svg>
);
const AppleIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
        <path d="M10 2c1 .5 2 2 2 5" />
    </svg>
);
const ActivityIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);
const CarIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="M9 17h6" />
    </svg>
);
const LightbulbIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
    </svg>
);
const HeartIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);
const FlagIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
);

const SunIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M6.34 17.66l-1.41 1.41" />
        <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
);
const MoonIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
);

// --- STORES ---
class RecentStore {
    static KEY = "apple_emoji_recent";
    static MAX = 50;
    static get(): string[] {
        try {
            const raw = localStorage.getItem(this.KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }
    static add(emoji: string) {
        try {
            let recent = this.get();
            recent = [emoji, ...recent.filter((e: string) => e !== emoji)].slice(0, this.MAX);
            localStorage.setItem(this.KEY, JSON.stringify(recent));
        } catch (e) {}
    }
}

// --- EMOJIS DATASET ---
const FULL_EMOJI_CATEGORIES = [
    {
        id: "smileys",
        name: "Smileys & People",
        emojis: [
            { id: "1", native: "😀", name: "Grinning Face", keywords: ["smile", "happy"] },
            {
                id: "2",
                native: "😃",
                name: "Smiling Face with Big Eyes",
                keywords: ["happy", "smile"],
            },
            {
                id: "3",
                native: "😄",
                name: "Smiling Face with Heart-Eyes",
                keywords: ["love", "adoring"],
            },
            { id: "4", native: "😁", name: "Beaming Face with Smiling Eyes", keywords: ["happy"] },
            { id: "5", native: "😆", name: "Grinning Squinting Face", keywords: ["laugh"] },
            { id: "6", native: "😅", name: "Grinning Face with Sweat", keywords: ["nervous"] },
            {
                id: "7",
                native: "🤣",
                name: "Rolling on the Floor Laughing",
                keywords: ["funny", "laugh"],
            },
            { id: "8", native: "😂", name: "Face with Tears of Joy", keywords: ["laugh", "cry"] },
            { id: "9", native: "🙂", name: "Slightly Smiling Face", keywords: ["smile"] },
            { id: "10", native: "🙃", name: "Upside-Down Face", keywords: ["silly"] },
            { id: "11", native: "😉", name: "Winking Face", keywords: ["flirt"] },
            { id: "12", native: "😊", name: "Smiling Face with Smiling Eyes", keywords: ["blush"] },
            { id: "13", native: "😇", name: "Smiling Face with Halo", keywords: ["angel"] },
            { id: "14", native: "🥰", name: "Smiling Face with Hearts", keywords: ["love"] },
            { id: "15", native: "😍", name: "Smiling Face with Heart-Eyes", keywords: ["love"] },
            { id: "16", native: "🤩", name: "Star-Struck", keywords: ["excited"] },
            { id: "17", native: "😘", name: "Face Blowing a Kiss", keywords: ["kiss"] },
            { id: "18", native: "😗", name: "Kissing Face", keywords: ["kiss"] },
            { id: "19", native: "☺️", name: "Smiling Face", keywords: ["happy"] },
            { id: "20", native: "😚", name: "Kissing Face with Closed Eyes", keywords: ["kiss"] },
            { id: "21", native: "😙", name: "Kissing Face with Smiling Eyes", keywords: ["kiss"] },
            { id: "22", native: "😋", name: "Face Savoring Food", keywords: ["yum"] },
            { id: "23", native: "😛", name: "Face with Tongue", keywords: ["tongue"] },
            { id: "24", native: "😜", name: "Winking Face with Tongue", keywords: ["silly"] },
            { id: "25", native: "🤪", name: "Zany Face", keywords: ["crazy"] },
            { id: "26", native: "😝", name: "Squinting Face with Tongue", keywords: ["silly"] },
            { id: "27", native: "🤑", name: "Money-Mouth Face", keywords: ["rich"] },
            { id: "28", native: "🤗", name: "Hugging Face", keywords: ["hug"] },
            { id: "29", native: "🤭", name: "Face with Hand Over Mouth", keywords: ["quiet"] },
            { id: "30", native: "🤫", name: "Shushing Face", keywords: ["quiet"] },
            { id: "31", native: "🤔", name: "Thinking Face", keywords: ["think"] },
            { id: "32", native: "🤐", name: "Zipper-Mouth Face", keywords: ["secret"] },
            { id: "33", native: "🤨", name: "Face with Raised Eyebrow", keywords: ["query"] },
            { id: "34", native: "😐", name: "Neutral Face", keywords: ["meh"] },
            { id: "35", native: "😑", name: "Expressionless Face", keywords: ["meh"] },
            { id: "36", native: "😶", name: "Face Without Mouth", keywords: ["quiet"] },
            { id: "37", native: "😏", name: "Smirking Face", keywords: ["sly"] },
            { id: "38", native: "😒", name: "Unamused Face", keywords: ["meh"] },
            { id: "39", native: "🙄", name: "Face with Rolling Eyes", keywords: ["annoyed"] },
            { id: "40", native: "😬", name: "Grimacing Face", keywords: ["awkward"] },
            { id: "41", native: "🤥", name: "Lying Face", keywords: ["lie"] },
            { id: "42", native: "😌", name: "Relieved Face", keywords: ["relief"] },
            { id: "43", native: "😔", name: "Pensive Face", keywords: ["sad"] },
            { id: "44", native: "😪", name: "Sleepy Face", keywords: ["tired"] },
            { id: "45", native: "🤤", name: "Drooling Face", keywords: ["sleep"] },
            { id: "46", native: "😴", name: "Sleeping Face", keywords: ["sleep"] },
            { id: "47", native: "😷", name: "Face with Medical Mask", keywords: ["sick"] },
            { id: "48", native: "🤒", name: "Face with Thermometer", keywords: ["sick"] },
            { id: "49", native: "👍", name: "Thumbs Up", keywords: ["yes"] },
            { id: "50", native: "👏", name: "Clapping Hands", keywords: ["congrats"] },
        ],
    },
    {
        id: "animals",
        name: "Animals & Nature",
        emojis: [
            { id: "a1", native: "🐶", name: "Dog Face", keywords: ["pet"] },
            { id: "a2", native: "🐱", name: "Cat Face", keywords: ["pet"] },
            { id: "a3", native: "🐭", name: "Mouse Face", keywords: ["animal"] },
            { id: "a4", native: "🐹", name: "Hamster Face", keywords: ["pet"] },
            { id: "a5", native: "🐰", name: "Rabbit Face", keywords: ["pet"] },
            { id: "a6", native: "🦊", name: "Fox", keywords: ["wild"] },
            { id: "a7", native: "🐻", name: "Bear", keywords: ["wild"] },
            { id: "a8", native: "🐼", name: "Panda", keywords: ["wild"] },
            { id: "a9", native: "🐨", name: "Koala", keywords: ["wild"] },
            { id: "a10", native: "🐯", name: "Tiger Face", keywords: ["wild"] },
            { id: "a11", native: "🦁", name: "Lion", keywords: ["wild"] },
            { id: "a12", native: "🐮", name: "Cow Face", keywords: ["farm"] },
            { id: "a13", native: "🐷", name: "Pig Face", keywords: ["farm"] },
            { id: "a14", native: "🐸", name: "Frog", keywords: ["wild"] },
            { id: "a15", native: "🐵", name: "Monkey Face", keywords: ["wild"] },
            { id: "a16", native: "🐔", name: "Chicken", keywords: ["farm"] },
            { id: "a17", native: "🐧", name: "Penguin", keywords: ["cold"] },
            { id: "a18", native: "🐦", name: "Bird", keywords: ["wild"] },
            { id: "a19", native: "🐤", name: "Baby Chick", keywords: ["farm"] },
            { id: "a20", native: "🦆", name: "Duck", keywords: ["wild"] },
            { id: "a21", native: "🦅", name: "Eagle", keywords: ["wild"] },
            { id: "a22", native: "🦉", name: "Owl", keywords: ["wild"] },
            { id: "a23", native: "🦇", name: "Bat", keywords: ["wild"] },
            { id: "a24", native: "🐺", name: "Wolf", keywords: ["wild"] },
            { id: "a25", native: "🐗", name: "Boar", keywords: ["wild"] },
            { id: "a26", native: "🐴", name: "Horse Face", keywords: ["farm"] },
            { id: "a27", native: "🦄", name: "Unicorn", keywords: ["magic"] },
            { id: "a28", native: "🐝", name: "Honeybee", keywords: ["bug"] },
            { id: "a29", native: "🐛", name: "Bug", keywords: ["insect"] },
            { id: "a30", native: "🦋", name: "Butterfly", keywords: ["bug"] },
            { id: "a31", native: "🐌", name: "Snail", keywords: ["slow"] },
            { id: "a32", native: "🐞", name: "Lady Beetle", keywords: ["bug"] },
            { id: "a33", native: "🐜", name: "Ant", keywords: ["bug"] },
            { id: "a34", native: "🕷️", name: "Spider", keywords: ["bug"] },
            { id: "a35", native: "🦂", name: "Scorpion", keywords: ["wild"] },
            { id: "a36", native: "🐢", name: "Turtle", keywords: ["slow"] },
            { id: "a37", native: "🐍", name: "Snake", keywords: ["wild"] },
            { id: "a38", native: "🦎", name: "Lizard", keywords: ["wild"] },
            { id: "a39", native: "🐙", name: "Octopus", keywords: ["sea"] },
            { id: "a40", native: "🦑", name: "Squid", keywords: ["sea"] },
            { id: "a41", native: "🐟", name: "Fish", keywords: ["sea"] },
            { id: "a42", native: "🐬", name: "Dolphin", keywords: ["sea"] },
            { id: "a43", native: "🐳", name: "Spouting Whale", keywords: ["sea"] },
            { id: "a44", native: "🦈", name: "Shark", keywords: ["sea"] },
            { id: "a45", native: "🌹", name: "Rose", keywords: ["flower"] },
            { id: "a46", native: "🌻", name: "Sunflower", keywords: ["flower"] },
            { id: "a47", native: "🌲", name: "Evergreen Tree", keywords: ["nature"] },
            { id: "a48", native: "🌵", name: "Cactus", keywords: ["nature"] },
            { id: "a49", native: "🍁", name: "Maple Leaf", keywords: ["nature"] },
            { id: "a50", native: "🍀", name: "Four Leaf Clover", keywords: ["lucky"] },
        ],
    },
    {
        id: "food",
        name: "Food & Drink",
        emojis: [
            { id: "f1", native: "🍎", name: "Red Apple", keywords: ["fruit"] },
            { id: "f2", native: "🍏", name: "Green Apple", keywords: ["fruit"] },
            { id: "f3", native: "🍐", name: "Pear", keywords: ["fruit"] },
            { id: "f4", native: "🍊", name: "Tangerine", keywords: ["fruit"] },
            { id: "f5", native: "🍋", name: "Lemon", keywords: ["fruit"] },
            { id: "f6", native: "🍌", name: "Banana", keywords: ["fruit"] },
            { id: "f7", native: "🍉", name: "Watermelon", keywords: ["fruit"] },
            { id: "f8", native: "🍇", name: "Grapes", keywords: ["fruit"] },
            { id: "f9", native: "🍓", name: "Strawberry", keywords: ["fruit"] },
            { id: "f10", native: "🍈", name: "Melon", keywords: ["fruit"] },
            { id: "f11", native: "🍒", name: "Cherries", keywords: ["fruit"] },
            { id: "f12", native: "🍑", name: "Peach", keywords: ["fruit"] },
            { id: "f13", native: "🍍", name: "Pineapple", keywords: ["fruit"] },
            { id: "f14", native: "🥥", name: "Coconut", keywords: ["fruit"] },
            { id: "f15", native: "🥝", name: "Kiwi Fruit", keywords: ["fruit"] },
            { id: "f16", native: "🍅", name: "Tomato", keywords: ["veg"] },
            { id: "f17", native: "🍆", name: "Eggplant", keywords: ["veg"] },
            { id: "f18", native: "🥑", name: "Avocado", keywords: ["healthy"] },
            { id: "f19", native: "🥦", name: "Broccoli", keywords: ["veg"] },
            { id: "f20", native: "🥒", name: "Cucumber", keywords: ["veg"] },
            { id: "f21", native: "🌽", name: "Ear of Corn", keywords: ["veg"] },
            { id: "f22", native: "🥕", name: "Carrot", keywords: ["veg"] },
            { id: "f23", native: "🥔", name: "Potato", keywords: ["veg"] },
            { id: "f24", native: "🥐", name: "Croissant", keywords: ["bakery"] },
            { id: "f25", native: "🍞", name: "Bread", keywords: ["bakery"] },
            { id: "f26", native: "🥖", name: "Baguette", keywords: ["bakery"] },
            { id: "f27", native: "🧀", name: "Cheese Wedge", keywords: ["dairy"] },
            { id: "f28", native: "🥚", name: "Egg", keywords: ["dairy"] },
            { id: "f29", native: "🥞", name: "Pancakes", keywords: ["sweet"] },
            { id: "f30", native: "🧇", name: "Waffle", keywords: ["sweet"] },
            { id: "f31", native: "🥓", name: "Bacon", keywords: ["meat"] },
            { id: "f32", native: "🍔", name: "Hamburger", keywords: ["fast food"] },
            { id: "f33", native: "🍟", name: "French Fries", keywords: ["fast food"] },
            { id: "f34", native: "🍕", name: "Pizza", keywords: ["fast food"] },
            { id: "f35", native: "🌭", name: "Hot Dog", keywords: ["fast food"] },
            { id: "f36", native: "🥪", name: "Sandwich", keywords: ["fast food"] },
            { id: "f37", native: "🌮", name: "Taco", keywords: ["mexican"] },
            { id: "f38", native: "🍣", name: "Sushi", keywords: ["japanese"] },
            { id: "f39", native: "🍚", name: "Cooked Rice", keywords: ["japanese"] },
            { id: "f40", native: "🍦", name: "Soft Ice Cream", keywords: ["dessert"] },
            { id: "f41", native: "🍪", name: "Cookie", keywords: ["dessert"] },
            { id: "f42", native: "🍰", name: "Shortcake", keywords: ["dessert"] },
            { id: "f43", native: "🍩", name: "Doughnut", keywords: ["dessert"] },
            { id: "f44", native: "🍫", name: "Chocolate Bar", keywords: ["dessert"] },
            { id: "f45", native: "🍬", name: "Candy", keywords: ["sweet"] },
            { id: "f46", native: "🍯", name: "Honey Pot", keywords: ["sweet"] },
            { id: "f47", native: "🥛", name: "Glass of Milk", keywords: ["drink"] },
            { id: "f48", native: "☕", name: "Hot Beverage", keywords: ["drink"] },
            { id: "f49", native: "🍵", name: "Teacup Without Handle", keywords: ["drink"] },
            { id: "f50", native: "🍺", name: "Beer Mug", keywords: ["drink"] },
        ],
    },
    {
        id: "activities",
        name: "Activities & Sports",
        emojis: [
            { id: "ac1", native: "⚽", name: "Soccer Ball", keywords: ["sports"] },
            { id: "ac2", native: "🏀", name: "Basketball", keywords: ["sports"] },
            { id: "ac3", native: "🏈", name: "American Football", keywords: ["sports"] },
            { id: "ac4", native: "⚾", name: "Baseball", keywords: ["sports"] },
            { id: "ac5", native: "🥎", name: "Softball", keywords: ["sports"] },
            { id: "ac6", native: "🎾", name: "Tennis", keywords: ["sports"] },
            { id: "ac7", native: "🏐", name: "Volleyball", keywords: ["sports"] },
            { id: "ac8", native: "🏉", name: "Rugby Football", keywords: ["sports"] },
            { id: "ac9", native: "🎱", name: "Pool 8 Ball", keywords: ["sports"] },
            { id: "ac10", native: "🏓", name: "Ping Pong", keywords: ["sports"] },
            { id: "ac11", native: "🏸", name: "Badminton", keywords: ["sports"] },
            { id: "ac12", native: "🥊", name: "Boxing Glove", keywords: ["sports"] },
            { id: "ac13", native: "🥋", name: "Martial Arts Uniform", keywords: ["sports"] },
            { id: "ac14", native: "🛹", name: "Skateboard", keywords: ["sports"] },
            { id: "ac15", native: "🛼", name: "Roller Skate", keywords: ["sports"] },
            { id: "ac16", native: "🥅", name: "Goal Net", keywords: ["sports"] },
            { id: "ac17", native: "🏹", name: "Bow and Arrow", keywords: ["sports"] },
            { id: "ac18", native: "🎣", name: "Fishing Pole", keywords: ["hobby"] },
            { id: "ac19", native: "🎮", name: "Video Game", keywords: ["play"] },
            { id: "ac20", native: "🏆", name: "Trophy", keywords: ["win"] },
            { id: "ac21", native: "🥇", name: "1st Place Medal", keywords: ["win"] },
            { id: "ac22", native: "🥈", name: "2nd Place Medal", keywords: ["win"] },
            { id: "ac23", native: "🥉", name: "3rd Place Medal", keywords: ["win"] },
            { id: "ac24", native: "🎸", name: "Guitar", keywords: ["music"] },
            { id: "ac25", native: "🎹", name: "Musical Keyboard", keywords: ["music"] },
            { id: "ac26", native: "🎻", name: "Violin", keywords: ["music"] },
            { id: "ac27", native: "🥁", name: "Drum", keywords: ["music"] },
            { id: "ac28", native: "🎺", name: "Trumpet", keywords: ["music"] },
            { id: "ac29", native: "🎤", name: "Microphone", keywords: ["sing"] },
            { id: "ac30", native: "🎧", name: "Headphones", keywords: ["music"] },
            { id: "ac31", native: "🎨", name: "Artist Palette", keywords: ["draw"] },
            { id: "ac32", native: "🎬", name: "Clapper Board", keywords: ["movie"] },
            { id: "ac33", native: "🎫", name: "Ticket", keywords: ["movie"] },
            { id: "ac34", native: "♟️", name: "Chess Pawn", keywords: ["play"] },
            { id: "ac35", native: "🎯", name: "Bullseye", keywords: ["play"] },
            { id: "ac36", native: "🪀", name: "Yo-Yo", keywords: ["play"] },
            { id: "ac37", native: "🪁", name: "Kite", keywords: ["play"] },
            { id: "ac38", native: "🧩", name: "Puzzle Piece", keywords: ["play"] },
            { id: "ac39", native: "🏃", name: "Person Running", keywords: ["sports"] },
            { id: "ac40", native: "🚴", name: "Person Biking", keywords: ["sports"] },
            { id: "ac41", native: "🏋️", name: "Person Lifting Weights", keywords: ["sports"] },
            { id: "ac42", native: "🏊", name: "Person Swimming", keywords: ["sports"] },
            { id: "ac43", native: "🤸", name: "Person Cartwheeling", keywords: ["sports"] },
            { id: "ac44", native: "🧗", name: "Person Climbing", keywords: ["sports"] },
            { id: "ac45", native: "💃", name: "Woman Dancing", keywords: ["dance"] },
            { id: "ac46", native: "🎳", name: "Bowling", keywords: ["sports"] },
            { id: "ac47", native: "⛳", name: "Flag in Hole", keywords: ["sports"] },
            { id: "ac48", native: "🛷", name: "Sled", keywords: ["sports"] },
            { id: "ac49", native: "🎿", name: "Skis", keywords: ["sports"] },
            { id: "ac50", native: "⛸️", name: "Ice Skate", keywords: ["sports"] },
        ],
    },
    {
        id: "travel",
        name: "Travel & Places",
        emojis: [
            { id: "t1", native: "🚗", name: "Automobile", keywords: ["car"] },
            { id: "t2", native: "🚕", name: "Taxi", keywords: ["car"] },
            { id: "t3", native: "🚙", name: "Sport Utility Vehicle", keywords: ["car"] },
            { id: "t4", native: "🚌", name: "Bus", keywords: ["vehicle"] },
            { id: "t5", native: "🚎", name: "Trolleybus", keywords: ["vehicle"] },
            { id: "t6", native: "🏎️", name: "Racing Car", keywords: ["car"] },
            { id: "t7", native: "🚓", name: "Police Car", keywords: ["car"] },
            { id: "t8", native: "🚑", name: "Ambulance", keywords: ["vehicle"] },
            { id: "t9", native: "🚒", name: "Fire Engine", keywords: ["vehicle"] },
            { id: "t10", native: "🚐", name: "Minibus", keywords: ["vehicle"] },
            { id: "t11", native: "🚚", name: "Delivery Truck", keywords: ["vehicle"] },
            { id: "t12", native: "🚜", name: "Tractor", keywords: ["vehicle"] },
            { id: "t13", native: "🛵", name: "Motor Scooter", keywords: ["vehicle"] },
            { id: "t14", native: "🚲", name: "Bicycle", keywords: ["vehicle"] },
            { id: "t15", native: "🚂", name: "Locomotive", keywords: ["vehicle"] },
            { id: "t16", native: "✈️", name: "Airplane", keywords: ["flight"] },
            { id: "t17", native: "🚀", name: "Rocket", keywords: ["space"] },
            { id: "t18", native: "🛸", name: "Flying Saucer", keywords: ["alien"] },
            { id: "t19", native: "🚁", name: "Helicopter", keywords: ["flight"] },
            { id: "t20", native: "🪂", name: "Parachute", keywords: ["flight"] },
            { id: "t21", native: "⛵", name: "Sailboat", keywords: ["sea"] },
            { id: "t22", native: "🚢", name: "Ship", keywords: ["sea"] },
            { id: "t23", native: "⚓", name: "Anchor", keywords: ["sea"] },
            { id: "t24", native: "⛽", name: "Fuel Pump", keywords: ["gas"] },
            { id: "t25", native: "🚨", name: "Police Car Light", keywords: ["alarm"] },
            { id: "t26", native: "🛑", name: "Stop Sign", keywords: ["warning"] },
            { id: "t27", native: "🏠", name: "House", keywords: ["building"] },
            { id: "t28", native: "🏢", name: "Office Building", keywords: ["building"] },
            { id: "t29", native: "🏣", name: "Japanese Post Office", keywords: ["building"] },
            { id: "t30", native: "🏥", name: "Hospital", keywords: ["building"] },
            { id: "t31", native: "🏦", name: "Bank", keywords: ["building"] },
            { id: "t32", native: "🏨", name: "Hotel", keywords: ["building"] },
            { id: "t33", native: "🏫", name: "School", keywords: ["building"] },
            { id: "t34", native: "🏟️", name: "Stadium", keywords: ["building"] },
            { id: "t35", native: "⛪", name: "Church", keywords: ["building"] },
            { id: "t36", native: "🕌", name: "Mosque", keywords: ["building"] },
            { id: "t37", native: "🕍", name: "Synagogue", keywords: ["building"] },
            { id: "t38", native: "⛺", name: "Tent", keywords: ["camp"] },
            { id: "t39", native: "🎡", name: "Ferris Wheel", keywords: ["park"] },
            { id: "t40", native: "🎢", name: "Roller Coaster", keywords: ["park"] },
            { id: "t41", native: "🗽", name: "Statue of Liberty", keywords: ["landmark"] },
            { id: "t42", native: "🗼", name: "Tokyo Tower", keywords: ["landmark"] },
            { id: "t43", native: "🗻", name: "Mount Fuji", keywords: ["mountain"] },
            { id: "t44", native: "🌋", name: "Volcano", keywords: ["nature"] },
            { id: "t45", native: "🏜️", name: "Desert", keywords: ["nature"] },
            { id: "t46", native: "🏖️", name: "Beach with Umbrella", keywords: ["summer"] },
            { id: "t47", native: "🏝️", name: "Desert Island", keywords: ["sea"] },
            { id: "t48", native: "🌈", name: "Rainbow", keywords: ["nature"] },
            { id: "t49", native: "☀️", name: "Sun", keywords: ["nature"] },
            { id: "t50", native: "☁️", name: "Cloud", keywords: ["nature"] },
        ],
    },
    {
        id: "objects",
        name: "Objects",
        emojis: [
            { id: "o1", native: "⌚", name: "Watch", keywords: ["time"] },
            { id: "o2", native: "📱", name: "Mobile Phone", keywords: ["tech"] },
            { id: "o3", native: "💻", name: "Laptop", keywords: ["tech"] },
            { id: "o4", native: "⌨️", name: "Keyboard", keywords: ["tech"] },
            { id: "o5", native: "🖥️", name: "Desktop Computer", keywords: ["tech"] },
            { id: "o6", native: "🖨️", name: "Printer", keywords: ["tech"] },
            { id: "o7", native: "🖱️", name: "Computer Mouse", keywords: ["tech"] },
            { id: "o8", native: "🕹️", name: "Joystick", keywords: ["play"] },
            { id: "o9", native: "📷", name: "Camera", keywords: ["photo"] },
            { id: "o10", native: "📹", name: "Video Camera", keywords: ["photo"] },
            { id: "o11", native: "📽️", name: "Movie Projector", keywords: ["photo"] },
            { id: "o12", native: "☎️", name: "Telephone", keywords: ["tech"] },
            { id: "o13", native: "📺", name: "Television", keywords: ["tech"] },
            { id: "o14", native: "📻", name: "Radio", keywords: ["tech"] },
            { id: "o15", native: "💡", name: "Light Bulb", keywords: ["idea"] },
            { id: "o16", native: "🔦", name: "Flashlight", keywords: ["tool"] },
            { id: "o17", native: "🕯️", name: "Candle", keywords: ["light"] },
            { id: "o18", native: "📖", name: "Open Book", keywords: ["study"] },
            { id: "o19", native: "📕", name: "Closed Book", keywords: ["study"] },
            { id: "o20", native: "✉️", name: "Envelope", keywords: ["mail"] },
            { id: "o21", native: "📦", name: "Package", keywords: ["mail"] },
            { id: "o22", native: "✏️", name: "Pencil", keywords: ["study"] },
            { id: "o23", native: "🖊️", name: "Pen", keywords: ["study"] },
            { id: "o24", native: "🔑", name: "Key", keywords: ["lock"] },
            { id: "o25", native: "🔨", name: "Hammer", keywords: ["tool"] },
            { id: "o26", native: "🛡️", name: "Shield", keywords: ["security"] },
            { id: "o27", native: "💸", name: "Money with Wings", keywords: ["money"] },
            { id: "o28", native: "💵", name: "Dollar Banknote", keywords: ["money"] },
            { id: "o29", native: "🪙", name: "Coin", keywords: ["money"] },
            { id: "o30", native: "💳", name: "Credit Card", keywords: ["money"] },
            { id: "o31", native: "✂️", name: "Scissors", keywords: ["tool"] },
            { id: "o32", native: "🔧", name: "Wrench", keywords: ["tool"] },
            { id: "o33", native: "🪛", name: "Screwdriver", keywords: ["tool"] },
            { id: "o34", native: "🪜", name: "Ladder", keywords: ["tool"] },
            { id: "o35", native: "🧰", name: "Toolbox", keywords: ["tool"] },
            { id: "o36", native: "🧲", name: "Magnet", keywords: ["tool"] },
            { id: "o37", native: "💉", name: "Syringe", keywords: ["medical"] },
            { id: "o38", native: "💊", name: "Pill", keywords: ["medical"] },
            { id: "o39", native: "🩺", name: "Stethoscope", keywords: ["medical"] },
            { id: "o40", native: "🔭", name: "Telescope", keywords: ["science"] },
            { id: "o41", native: "🔬", name: "Microscope", keywords: ["science"] },
            { id: "o42", native: "🌂", name: "Closed Umbrella", keywords: ["weather"] },
            { id: "o43", native: "💼", name: "Briefcase", keywords: ["work"] },
            { id: "o44", native: "📋", name: "Clipboard", keywords: ["work"] },
            { id: "o45", native: "👓", name: "Glasses", keywords: ["fashion"] },
            { id: "o46", native: "🧺", name: "Basket", keywords: ["home"] },
            { id: "o47", native: "🪞", name: "Mirror", keywords: ["home"] },
            { id: "o48", native: "🧼", name: "Soap", keywords: ["home"] },
            { id: "o49", native: "🧽", name: "Sponge", keywords: ["home"] },
            { id: "o50", native: "🧹", name: "Broom", keywords: ["home"] },
        ],
    },
    {
        id: "symbols",
        name: "Symbols",
        emojis: [
            { id: "s1", native: "❤️", name: "Red Heart", keywords: ["love"] },
            { id: "s2", native: "🧡", name: "Orange Heart", keywords: ["love"] },
            { id: "s3", native: "💛", name: "Yellow Heart", keywords: ["love"] },
            { id: "s4", native: "💚", name: "Green Heart", keywords: ["love"] },
            { id: "s5", native: "💙", name: "Blue Heart", keywords: ["love"] },
            { id: "s6", native: "💜", name: "Purple Heart", keywords: ["love"] },
            { id: "s7", native: "🖤", name: "Black Heart", keywords: ["love"] },
            { id: "s8", native: "🤍", name: "White Heart", keywords: ["love"] },
            { id: "s9", native: "🤎", name: "Brown Heart", keywords: ["love"] },
            { id: "s10", native: "💔", name: "Broken Heart", keywords: ["sad"] },
            { id: "s11", native: "❣️", name: "Heart Exclamation", keywords: ["love"] },
            { id: "s12", native: "💕", name: "Two Hearts", keywords: ["love"] },
            { id: "s13", native: "💞", name: "Revolving Hearts", keywords: ["love"] },
            { id: "s14", native: "💓", name: "Beating Heart", keywords: ["love"] },
            { id: "s15", native: "💗", name: "Growing Heart", keywords: ["love"] },
            { id: "s16", native: "💖", name: "Sparkling Heart", keywords: ["love"] },
            { id: "s17", native: "💘", name: "Heart with Arrow", keywords: ["love"] },
            { id: "s18", native: "💝", name: "Heart with Ribbon", keywords: ["love"] },
            { id: "s20", native: "💟", name: "Heart Decoration", keywords: ["love"] },
            { id: "s21", native: "💤", name: "Zzz", keywords: ["sleep"] },
            { id: "s22", native: "💥", name: "Collision", keywords: ["warning"] },
            { id: "s23", native: "♨️", name: "Hot Springs", keywords: ["symbol"] },
            { id: "s24", native: "🛑", name: "Stop Sign", keywords: ["warning"] },
            { id: "s25", native: "⚠️", name: "Warning", keywords: ["warning"] },
            { id: "s26", native: "☣️", name: "Biohazard", keywords: ["warning"] },
            { id: "s27", native: "☢️", name: "Radioactive", keywords: ["warning"] },
            { id: "s28", native: "🔇", name: "Muted Speaker", keywords: ["sound"] },
            { id: "s29", native: "🔈", name: "Speaker Low Volume", keywords: ["sound"] },
            { id: "s30", native: "🔊", name: "Speaker High Volume", keywords: ["sound"] },
            { id: "s31", native: "🎵", name: "Musical Note", keywords: ["music"] },
            { id: "s32", native: "🎶", name: "Musical Notes", keywords: ["music"] },
            { id: "s33", native: "➕", name: "Plus Sign", keywords: ["math"] },
            { id: "s34", native: "➖", name: "Minus Sign", keywords: ["math"] },
            { id: "s35", native: "✖️", name: "Multiply Sign", keywords: ["math"] },
            { id: "s36", native: "➗", name: "Divide Sign", keywords: ["math"] },
            { id: "s37", native: "❓", name: "Question Mark", keywords: ["query"] },
            { id: "s38", native: "❗", name: "Exclamation Mark", keywords: ["warning"] },
            { id: "s39", native: "💯", name: "Perfect Score", keywords: ["perfect"] },
            { id: "s40", native: "♻️", name: "Recycle", keywords: ["green"] },
            { id: "s41", native: "🔱", name: "Trident", keywords: ["symbol"] },
            { id: "s42", native: "⭕", name: "Circle", keywords: ["symbol"] },
            { id: "s43", native: "❌", name: "Cross", keywords: ["no"] },
            { id: "s44", native: "☑️", name: "Check Box", keywords: ["yes"] },
            { id: "s45", native: "✔️", name: "Check", keywords: ["yes"] },
            { id: "s46", native: "↗️", name: "Up-Right", keywords: ["arrow"] },
            { id: "s47", native: "⬇️", name: "Down", keywords: ["arrow"] },
            { id: "s48", native: "🔄", name: "Refresh", keywords: ["refresh"] },
            { id: "s49", native: "🇺🇳", name: "UN Flag", keywords: ["flag"] },
            { id: "s50", native: "♾️", name: "Infinity", keywords: ["math"] },
        ],
    },
    {
        id: "flags",
        name: "Flags of the World",
        emojis: [
            { id: "fl1", native: "🇺🇸", name: "Flag: United States", keywords: ["usa", "america"] },
            { id: "fl2", native: "🇬🇧", name: "Flag: United Kingdom", keywords: ["britain", "uk"] },
            { id: "fl3", native: "🇨🇦", name: "Flag: Canada", keywords: ["canada"] },
            { id: "fl4", native: "🇦🇺", name: "Flag: Australia", keywords: ["australia"] },
            { id: "fl5", native: "🇯🇵", name: "Flag: Japan", keywords: ["japan"] },
            { id: "fl6", native: "🇩🇪", name: "Flag: Germany", keywords: ["germany"] },
            { id: "fl7", native: "🇫🇷", name: "Flag: France", keywords: ["france"] },
            { id: "fl8", native: "🇮🇹", name: "Flag: Italy", keywords: ["italy"] },
            { id: "fl9", native: "🇧🇷", name: "Flag: Brazil", keywords: ["brazil"] },
            { id: "fl10", native: "🇮🇳", name: "Flag: India", keywords: ["india"] },
            { id: "fl11", native: "🇵🇰", name: "Flag: Pakistan", keywords: ["pakistan"] },
            { id: "fl12", native: "🇨🇳", name: "Flag: China", keywords: ["china"] },
            { id: "fl13", native: "🇪🇸", name: "Flag: Spain", keywords: ["spain"] },
            { id: "fl14", native: "🇲🇽", name: "Flag: Mexico", keywords: ["mexico"] },
            { id: "fl15", native: "🇷🇺", name: "Flag: Russia", keywords: ["russia"] },
            { id: "fl16", native: "🇰🇷", name: "Flag: South Korea", keywords: ["korea"] },
            { id: "fl17", native: "🇿🇦", name: "Flag: South Africa", keywords: ["africa"] },
            { id: "fl18", native: "🇹🇷", name: "Flag: Turkey", keywords: ["turkey"] },
            { id: "fl19", native: "🇸🇦", name: "Flag: Saudi Arabia", keywords: ["saudi"] },
            { id: "fl20", native: "🇪🇬", name: "Flag: Egypt", keywords: ["egypt"] },
            { id: "fl21", native: "🇮🇩", name: "Flag: Indonesia", keywords: ["indonesia"] },
            { id: "fl22", native: "🇲🇾", name: "Flag: Malaysia", keywords: ["malaysia"] },
            { id: "fl23", native: "🇸🇬", name: "Flag: Singapore", keywords: ["singapore"] },
            { id: "fl24", native: "🇳🇿", name: "Flag: New Zealand", keywords: ["nz"] },
            { id: "fl25", native: "🇳🇱", name: "Flag: Netherlands", keywords: ["dutch"] },
            { id: "fl26", native: "🇨🇭", name: "Flag: Switzerland", keywords: ["swiss"] },
            { id: "fl27", native: "🇸🇪", name: "Flag: Sweden", keywords: ["sweden"] },
            { id: "fl28", native: "🇳🇴", name: "Flag: Norway", keywords: ["norway"] },
            { id: "fl29", native: "🇩🇰", name: "Flag: Denmark", keywords: ["denmark"] },
            { id: "fl30", native: "🇫🇮", name: "Flag: Finland", keywords: ["finland"] },
            { id: "fl31", native: "🇮🇪", name: "Flag: Ireland", keywords: ["irish"] },
            { id: "fl32", native: "🇵🇹", name: "Flag: Portugal", keywords: ["portugal"] },
            { id: "fl33", native: "🇬🇷", name: "Flag: Greece", keywords: ["greece"] },
            { id: "fl34", native: "🇺🇦", name: "Flag: Ukraine", keywords: ["ukraine"] },
            { id: "fl35", native: "🇵🇱", name: "Flag: Poland", keywords: ["poland"] },
            { id: "fl36", native: "🇻🇳", name: "Flag: Vietnam", keywords: ["vietnam"] },
            { id: "fl37", native: "🇹🇭", name: "Flag: Thailand", keywords: ["thailand"] },
            { id: "fl38", native: "🇵🇭", name: "Flag: Philippines", keywords: ["philippines"] },
            { id: "fl39", native: "🇦🇷", name: "Flag: Argentina", keywords: ["argentina"] },
            { id: "fl40", native: "🇨🇱", name: "Flag: Chile", keywords: ["chile"] },
            { id: "fl41", native: "🇨🇴", name: "Flag: Colombia", keywords: ["colombia"] },
            { id: "fl42", native: "🇵🇪", name: "Flag: Peru", keywords: ["peru"] },
            { id: "fl43", native: "🇳🇬", name: "Flag: Nigeria", keywords: ["nigeria"] },
            { id: "fl44", native: "🇰🇪", name: "Flag: Kenya", keywords: ["kenya"] },
            { id: "fl45", native: "🇲🇦", name: "Flag: Morocco", keywords: ["morocco"] },
            { id: "fl46", native: "🇦🇪", name: "Flag: United Arab Emirates", keywords: ["uae"] },
            { id: "fl47", native: "🇧🇩", name: "Flag: Bangladesh", keywords: ["bangladesh"] },
            { id: "fl48", native: "🇦🇫", name: "Flag: Afghanistan", keywords: ["afghanistan"] },
            { id: "fl49", native: "🇮🇷", name: "Flag: Iran", keywords: ["iran"] },
            { id: "fl50", native: "🇮🇶", name: "Flag: Iraq", keywords: ["iraq"] },
            { id: "fl51", native: "🇸🇾", name: "Flag: Syria", keywords: ["syria"] },
            { id: "fl52", native: "🇵🇸", name: "Flag: Palestine", keywords: ["palestine"] },
            { id: "fl53", native: "🇯🇴", name: "Flag: Jordan", keywords: ["jordan"] },
            { id: "fl54", native: "🇱🇧", name: "Flag: Lebanon", keywords: ["lebanon"] },
            { id: "fl55", native: "🇱🇾", name: "Flag: Libya", keywords: ["libya"] },
            { id: "fl56", native: "🇸🇩", name: "Flag: Sudan", keywords: ["sudan"] },
            { id: "fl57", native: "🇩🇿", name: "Flag: Algeria", keywords: ["algeria"] },
            { id: "fl58", native: "🇹🇳", name: "Flag: Tunisia", keywords: ["tunisia"] },
            { id: "fl59", native: "🇶🇦", name: "Flag: Qatar", keywords: ["qatar"] },
            { id: "fl60", native: "🇰🇼", name: "Flag: Kuwait", keywords: ["kuwait"] },
        ],
    },
];

// --- SUB-COMPONENTS ---
const EmojiSearch = ({ value, onChange, isDark, toggleTheme }: any) => {
    const [isListening, setIsListening] = useState(false);

    const handleVoice = () => {
        setIsListening(true);
        if ("webkitSpeechRecognition" in window) {
            const rec = new (window as any).webkitSpeechRecognition();
            rec.onresult = (e: any) => {
                onChange(e.results[0][0].transcript);
                setIsListening(false);
            };
            rec.onerror = () => setIsListening(false);
            rec.start();
        } else {
            alert("Voice search not supported in this browser.");
            setIsListening(false);
        }
    };

    return (
        <div className="sticky top-0 z-20 px-4 py-3 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-black/5 dark:bg-[#1C1C1E]/80 dark:border-white/10">
            <div className="flex items-center w-full h-10 bg-white rounded-[10px] shadow-sm border border-black/5 dark:bg-[#2C2C2E] dark:border-white/5 overflow-hidden">
                <div className="pl-3 text-gray-400">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Search Emoji"
                    className="flex-1 w-full h-full px-3 text-[15px] bg-transparent outline-none text-black dark:text-white"
                />
                {value && (
                    <button
                        onClick={() => onChange("")}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <XIcon />
                    </button>
                )}
                <button
                    onClick={handleVoice}
                    className={`p-2 transition-colors ${isListening ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"}`}
                >
                    <MicIcon />
                </button>
                <button
                    onClick={toggleTheme}
                    className="p-2 border-l border-black/5 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                    title="Toggle Theme"
                >
                    {isDark ? <SunIcon /> : <MoonIcon />}
                </button>
            </div>
        </div>
    );
};

const EmojiGrid = ({
    categories,
    searchQuery,
    onSelect,
    activeCategory,
    onScrollCategory,
}: any) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const categoryRefs = useRef<any>({});

    const filteredCategories = categories
        .map((cat: any) => ({
            ...cat,
            emojis: cat.emojis.filter(
                (e: any) =>
                    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.keywords.some((k: string) =>
                        k.toLowerCase().includes(searchQuery.toLowerCase()),
                    ),
            ),
        }))
        .filter((cat: any) => cat.emojis.length > 0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleScroll = () => {
            const offsets = Object.entries(categoryRefs.current).map(([id, ref]: any) => ({
                id,
                top: ref
                    ? ref.getBoundingClientRect().top - container.getBoundingClientRect().top
                    : Infinity,
            }));
            const current = offsets.filter((o) => o.top <= 40).pop();
            if (current && current.id !== activeCategory) onScrollCategory(current.id);
        };
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [activeCategory, onScrollCategory]);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 pb-16 custom-scrollbar scroll-smooth"
        >
            {filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p className="text-sm font-medium">No emojis found</p>
                </div>
            ) : (
                filteredCategories.map((category: any) => (
                    <div
                        key={category.id}
                        ref={(el) => {
                            categoryRefs.current[category.id] = el;
                        }}
                        className="mb-6"
                        id={`category-${category.id}`}
                    >
                        <h3 className="sticky top-0 z-10 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-[#F5F5F7]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md">
                            {category.name}
                        </h3>
                        <div className="grid grid-cols-7 gap-1.5 mt-2">
                            {category.emojis.map((emoji: any) => (
                                <button
                                    key={emoji.id}
                                    onClick={() => onSelect(emoji)}
                                    title={emoji.name}
                                    className="flex items-center justify-center w-10 h-10 text-2xl rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:scale-125 active:scale-90 transition-all duration-150 focus:outline-none"
                                >
                                    {emoji.native}
                                </button>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const CategoryTabs = ({ activeCategory, onSelect }: any) => {
    const tabs = [
        { id: "recent", icon: ClockIcon, label: "Recent" },
        { id: "smileys", icon: SmileIcon, label: "Smileys" },
        { id: "animals", icon: CatIcon, label: "Animals" },
        { id: "food", icon: AppleIcon, label: "Food" },
        { id: "activities", icon: ActivityIcon, label: "Activities" },
        { id: "travel", icon: CarIcon, label: "Travel" },
        { id: "objects", icon: LightbulbIcon, label: "Objects" },
        { id: "symbols", icon: HeartIcon, label: "Symbols" },
        { id: "flags", icon: FlagIcon, label: "Flags" },
    ];

    return (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2 bg-[#F5F5F7]/90 backdrop-blur-xl border-t border-black/5 dark:bg-[#1C1C1E]/90 dark:border-white/10 flex justify-between items-center">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onSelect(tab.id)}
                        className={`relative p-1.5 rounded-full transition-colors focus:outline-none ${isActive ? "text-blue-500" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200"}`}
                        title={tab.label}
                    >
                        {isActive && (
                            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-full" />
                        )}
                        <Icon />
                    </button>
                );
            })}
        </div>
    );
};

// --- MAIN EXPORTED COMPONENT ---
export const Component = ({
    isOpen,
    onClose,
    onEmojiSelect,
    variant = "modal",
}: {
    isOpen: boolean;
    onClose: () => void;
    onEmojiSelect: (emoji: any) => void;
    variant?: "modal" | "drawer";
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("smileys");
    const [recentEmojis, setRecentEmojis] = useState<any[]>([]);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const recents = RecentStore.get();
            setRecentEmojis(
                recents.map((native) => ({ id: native, native, name: native, keywords: [] })),
            );
        }
        setIsDark(document.documentElement.classList.contains("dark"));
    }, [isOpen]);

    const handleSelect = (emoji: any) => {
        RecentStore.add(emoji.native);
        onEmojiSelect(emoji);
        onClose();
    };

    const handleTabSelect = (categoryId: string) => {
        setActiveCategory(categoryId);
        const el = document.getElementById(`category-${categoryId}`);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    if (!isOpen) return null;

    const displayCategories = [
        ...(recentEmojis.length > 0
            ? [{ id: "recent", name: "Recently Used", emojis: recentEmojis }]
            : []),
        ...FULL_EMOJI_CATEGORIES,
    ];

    if (variant === "drawer") {
        return (
            <div className="pointer-events-auto relative flex flex-col h-[420px] bg-[#F5F5F7] dark:bg-[#1C1C1E] rounded-t-2xl border border-b-0 border-white/20 dark:border-white/10 shadow-2xl overflow-hidden text-black dark:text-white animate-in slide-in-from-bottom duration-300">
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                    .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 99px; border: 2px solid transparent; background-clip: padding-box; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.35); }
                    .dark .custom-scrollbar { scrollbar-color: rgba(255,255,255,0.25) transparent; }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border: 2px solid transparent; background-clip: padding-box; }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.45); }
                `,
                    }}
                />
                <div className="flex justify-center pt-2 pb-0">
                    <div className="h-1.5 w-10 rounded-full bg-black/10 dark:bg-white/20" />
                </div>
                <EmojiSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                />
                <EmojiGrid
                    categories={displayCategories}
                    searchQuery={searchQuery}
                    onSelect={handleSelect}
                    activeCategory={activeCategory}
                    onScrollCategory={setActiveCategory}
                />
                {!searchQuery && (
                    <CategoryTabs activeCategory={activeCategory} onSelect={handleTabSelect} />
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />
            <div className="pointer-events-auto relative flex flex-col w-[350px] h-[450px] bg-[#F5F5F7]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-black dark:text-white">
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                    .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 99px; border: 2px solid transparent; background-clip: padding-box; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.35); }
                    .dark .custom-scrollbar { scrollbar-color: rgba(255,255,255,0.25) transparent; }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border: 2px solid transparent; background-clip: padding-box; }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.45); }
                `,
                    }}
                />
                <EmojiSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                />
                <EmojiGrid
                    categories={displayCategories}
                    searchQuery={searchQuery}
                    onSelect={handleSelect}
                    activeCategory={activeCategory}
                    onScrollCategory={setActiveCategory}
                />
                {!searchQuery && (
                    <CategoryTabs activeCategory={activeCategory} onSelect={handleTabSelect} />
                )}
            </div>
        </div>
    );
};
