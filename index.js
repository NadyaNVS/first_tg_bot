const TelegramBot = require("node-telegram-bot-api");
const { gameOptions, againOptions } = require("./options");
const sequelize = require("./db");
const UserModel = require("./models");
require("dotenv").config();
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(
    chatId,
    "Welcome to the Number Guessing Game! I am thinking of a number between 0 and 9."
  );
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;
  await bot.sendMessage(chatId, "Take a guess!", gameOptions);
};

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (err) {
    console.log("Something went wrong", err);
  }
  bot.setMyCommands([
    { command: "/start", description: "First greetings." },
    { command: "/info", description: "Receive information adout user." },
    { command: "/game", description: "Start the game." },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if (text === "/start") {
        await UserModel.create({ chatId });
        await bot.sendSticker(
          chatId,
          "https://tlgrm.eu/_/stickers/7e8/aa6/7e8aa67b-ad91-4d61-8f62-301bde115989/256/2.webp"
        );
        return bot.sendMessage(chatId, "Welcome to nvgame_bot!");
      }
      if (text === "/info") {
        const user = await UserModel.findOne({ chatId });
        return bot.sendMessage(
          chatId,
          `Your name is ${msg.from.first_name} ${msg.from.last_name}. Number of right answers is ${user.right}, incorrect - ${user.wrong}`
        );
      }
      if (text === "/game") {
        return startGame(chatId);
      }
      return bot.sendMessage(
        chatId,
        "Sorry, I do not understand you. Please try again."
      );
    } catch (err) {
      return bot.sendMessage(chatId, "Something went wrong");
    }
  });
  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;
    if (data === "/again") {
      return startGame(chatId);
    }
    const user = await UserModel.findOne({ chatId });
    if (data == chats[chatId]) {
      user.right += 1;

      await bot.sendMessage(chatId, "You win the game!", againOptions);
    } else {
      user.wrong += 1;

      await bot.sendMessage(
        chatId,
        `You lose the game! The answer is ${chats[chatId]}`,
        againOptions
      );
    }
    await user.save();
  });
};

start();
