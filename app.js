const nodeCron = require('node-cron');
const puppeteer = require('puppeteer');
const ora = require('ora');
const chalk = require('chalk');

const url = "https://www.worldometers.info/world-population/";

async function scrapeWorldPopulation() {
    console.log(chalk.green("Running scheduled job"));
    const spinner = ora({
        text: "Launching puppeteer",
        color: "blue",
        hideCursor: false,
    }).start();

    try {
        const date = Date.now();
        const browser = await puppeteer.launch();
        spinner.text = "Launching headless browser page";
        const newPage = await browser.newPage();
        spinner.text = "Navigation to URL";
        await newPage.goto(url, { waitUntil: "load", timeout: 0 });
        spinner.text = "Scraping page";
        const digitGroup = await newPage.evaluate(() => {
            const digitGroupArr = [];
            const selector = "#maincounter-wrap .maincounter-number .rts-counter span";
            const digitSpans = document.querySelectorAll(selector);
            digitSpans.forEach((span) => {
                if (!isNaN(parseInt(span.textContent))) {
                    digitGroupArr.push(span.textContent);
                }
            });
            return JSON.stringify(digitGroupArr);
        });
        spinner.text = "Closing headless browser";
        await browser.close();
        spinner.succeed(`Page scraping successful after ${Date.now() - date}ms`);
        spinner.clear();
        console.log(
            chalk.yellow.bold(`World population on ${new Date().toISOString()}:`),
            chalk.blue.bold(JSON.parse(digitGroup).join(","))
        );
    } catch (error) {
        spinner.fail({ text: "Scraping failde" });
        spinner.clear();
        console.log(chalk.red(error));
    }
}

const job = nodeCron.schedule("*/2 * * * *", scrapeWorldPopulation);
