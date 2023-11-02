'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');

let textForTyping = '';
let texts = [];
let startNumber = 5;
let textNumber = 0;
const PATH = './blind_printing_simulator/public/JSON/texts_for_typing.json';
const SOURCE = 'https://ilibrary.ru';
let textId = 0;
let bookNumber = 1;

getTextsForTyping(); // не удивляйся, что не работает - раскомментируй эту строку

async function getTextsForTyping() {
  const browser = await puppeteer.launch({
    headless: 'new',
  });
  const page = await browser.newPage();

  await page.goto(SOURCE);
  console.log(
    await page.$eval('.ltst_b > .ltst_l', (elem) => elem.children.length)
  );
  while (
    bookNumber <=
    (await page.$eval('.ltst_b > .ltst_l', (elem) => elem.children.length))
  ) {
    let textLink = await page.$eval(
      `.ltst_l > li:nth-child(${bookNumber++}) > a`,
      (elem) => elem.getAttribute('href')
    );
    console.log(textLink);

    await page.goto(`${SOURCE}${textLink}`);
    let textsAmount = (await page.$$('.p')).length + startNumber - 1;

    point1: for (; textId < textsAmount; textId++) {
      point2: while (true) {
        textForTyping +=
          ' ' +
          (await page.$eval(
            `.p:nth-child(${startNumber + textNumber++})`,
            (elem) => elem.textContent
          ));

        if (
          textForTyping.length < 250 &&
          startNumber + textNumber >=
          textsAmount
        )
          break point1;

        if (textForTyping.length < 250) continue point2;

        texts.push({
          id: textId,
          text: textPreparation(textForTyping),
        });
        textForTyping = '';

        break;
      }
    }

    textNumber = 0;
    await page.goto(SOURCE);
  }

  await browser.close();

  postText();
}

async function postText() {
  fs.writeFile(`.${PATH}`, JSON.stringify(texts, null, 2), (error, data) => {
    if (error) {
      console.log(`ошибка при записи текста в ${PATH}`);
      return;
    }
    console.log(`текст записан в .${PATH}`);

    fs.readFile(`.${PATH}`, { flag: 'r', encoding: 'utf-8'}, (error, data) => {
      if (error) {
        console.log(`ошибка при чтении файла .${PATH}`);
        return;
      }
    });
  });
}

function textPreparation(textForTyping) {
  let textEnd = textForTyping.slice(0, 300).lastIndexOf('.');

  return textForTyping
    .slice(0, textEnd + 1)
    .replaceAll('—', '-')
    .replaceAll('«', '"')
    .replaceAll('»', '"')
    .trim();
}
