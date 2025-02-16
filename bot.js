import { Telegraf } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Команда /start — приветствие и предложение авторизации
bot.start((ctx) => {
  const welcomeMessage = `
Добро пожаловать, ${ctx.from.first_name}!
Чтобы авторизоваться, нажмите кнопку ниже.`;
  // Отправляем сообщение с inline‑кнопкой для авторизации
  ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Авторизация', callback_data: 'auth' }
        ]
      ]
    }
  });
});

// Обработка нажатия на кнопку авторизации (callback query)
bot.action('auth', async (ctx) => {
  try {
    // Извлекаем данные пользователя из ctx.from
    const telegramUser = ctx.from;
    console.log('Получены данные пользователя:', telegramUser);

    // Отправляем POST-запрос на backend для авторизации/регистрации
    const response = await axios.post(process.env.BACKEND_URL + '/api/auth/telegram', telegramUser, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Если backend вернул успех – уведомляем пользователя
    if (response.data.success) {
      const redirectUrl = `${process.env.FRONTEND_URL}?authToken=${response.data.token}`;
      await ctx.answerCbQuery();
      await ctx.reply('Авторизация прошла успешно!', {
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: 'Перейти в приложение', 
                url: redirectUrl 
              }
            ]
          ]
        }
      });
    } else {
      await ctx.answerCbQuery('Ошибка авторизации');
    }
  } catch (error) {
    console.error('Ошибка при авторизации:', error.message);
    await ctx.answerCbQuery('Ошибка при подключении к серверу');
  }
});

// Дополнительная обработка текстовых сообщений (опционально)
bot.hears(/авторизация/i, async (ctx) => {
  // Можно повторно отправить сообщение с кнопкой, если пользователь написал "авторизация"
  ctx.reply('Пожалуйста, нажмите на кнопку ниже для авторизации.', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Авторизация', callback_data: 'auth' }
        ]
      ]
    }
  });
});

// Запуск бота в режиме long polling
bot.launch().then(() => {
  console.log('Бот запущен');
});

// Обработка сигналов для корректного завершения работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));