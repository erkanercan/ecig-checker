import * as dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { Telegraf } from 'telegraf';
dotenv.config();

(async (): Promise<void> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(process.env.PAGE_URL);
  const priceElement = await page.$('.price');
  const element = await page.$('#divIlgiliUrunler');
  const flavours = await page.evaluate(
    (element) =>
      Array.from(element.querySelectorAll('label')).map((element) => {
        const img = element.querySelector('img');
        const span = element.querySelector('span');
        return {
          img_url: img?.getAttribute('src'),
          text: span?.textContent,
        };
      }),
    element,
  );

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  bot.telegram.sendMessage(
    process.env.TELEGRAM_USER_ID,
    `Current Hour: ${new Date().toLocaleTimeString(
      'tr-TR',
    )} \nTotal Flavours: ${flavours.length}`,
  );

  for (const flavour of flavours) {
    await bot.telegram.sendPhoto(
      process.env.TELEGRAM_USER_ID,
      {
        url: flavour.img_url,
      },
      {
        caption: flavour.text,
      },
    );
  }

  // Check if a flavour with "Blue Razz" text exists. We don't know how they write it, so we need to check variations like "Blue Razz", "blue razz", etc.
  const blueRazzFlavour = flavours.find((flavour) =>
    flavour.text?.toLowerCase().includes('blue'),
  );

  if (blueRazzFlavour) {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_USER_ID,
      `Blue Razz flavour is available!`,
    );
  }

  const price = await page.evaluate(
    (priceElement) => priceElement.textContent,
    priceElement,
  );

  const formattedPrice = price?.trim();

  await bot.telegram.sendMessage(
    process.env.TELEGRAM_USER_ID,
    `Current price: ${formattedPrice}`,
  );
  await bot.telegram.sendMessage(
    process.env.TELEGRAM_USER_ID,
    `Buy it here: ${process.env.PAGE_URL}`,
  );

  await element.dispose();

  await browser.close();
})();
