const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 8000;
const urls = [
    {
        name: 'all', 
        link: 'https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/ref=zg_bs_unv_electronics_1_10048700011_1'
    },
    {
        name: 'accessories&supplies',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Electronics-Accessories-Supplies/zgbs/electronics/281407/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'camera&photo',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Camera-Photo-Products/zgbs/electronics/502394/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'carelectronics',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Car-Electronics/zgbs/electronics/1077068/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'cellphones&accessories',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Cell-Phones-Accessories/zgbs/electronics/2811119011/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'computers&accessories',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Computers-Accessories/zgbs/electronics/541966/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'gps&navigation',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-GPS-Finders-Accessories/zgbs/electronics/172526/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'headphones',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Headphones-Earbuds/zgbs/electronics/172541/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'homeaudio&theater',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Home-Audio-Theater-Products/zgbs/electronics/667846011/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'marineelectronics',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Marine-Electronics/zgbs/electronics/319574011/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'officeelectronics',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Office-Electronics-Products/zgbs/electronics/172574/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'portableaudio&video',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Portable-Audio-Video/zgbs/electronics/172623/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'security&surveillance',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Security-Surveillance-Equipment/zgbs/electronics/524136/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'service&replacementplans',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Computers-Electronics-Service-Plans/zgbs/electronics/16285901/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'televisions&video',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Televisions-Video-Products/zgbs/electronics/1266092011/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'videogameconsoles&accessories',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Video-Game-Consoles-Accessories/zgbs/electronics/7926841011/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'videoprojectors',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Video-Projectors/zgbs/electronics/300334/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'wearabletechnology',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-Wearable-Technology/zgbs/electronics/10048700011/ref=zg_bs_nav_electronics_1'
    },
    {
        name: 'ebookreaders&accessories',
        link: 'https://www.amazon.com/Best-Sellers-Electronics-eBook-Readers-Accessories/zgbs/electronics/2642125011/ref=zg_bs_nav_electronics_1'
    }
];

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
app.get('/', (req, res) => {
    res.json('Welcome to my Amazon Web Scraping API!');
});

app.get('*', async(req, res) => {
    try {//finds url in array based on request url params
        const url = urls.find((url) => url.name === req.url.replace('/', ''));
        let results = await getProducts(url.link);
        res.json(results);
    } catch (error) {
        res.status(400).json('Invalid endpoint');
    }
});

async function getProducts(link){
    const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: false,
        userDataDir: "./tmp",
        args: [
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--single-process',
            '--no-zygote'
        ],
        executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH: puppeteer.executablePath()
    });

    const page = await browser.newPage();
    let isButtonDisabled = false;
    let products = [];

    await page.goto(link);
    await page.setViewport({width: 1200, height: 800});

    while(!isButtonDisabled){ //checking if 'next' button is disabled, if it is, job is done
        await autoScroll(page);
        const productHandles = await page.$$('.p13n-gridRow._cDEzb_grid-row_3Cywl > .a-column.a-span12.a-text-center._cDEzb_grid-column_2hIsc');

        for(const productHandle of productHandles){ 
            let title = "null";
            let price = "null";
            let link = "null";
            const baseUrl = 'https://www.amazon.com';

            try {
                title = await page.evaluate(el => el.querySelector("span > div").textContent, productHandle);
            } catch (error) {}

            try {
                price = await page.evaluate(el => el.querySelector("span > span").textContent, productHandle);
            } catch (error) {}
            
            try {
                link = await page.evaluate(el => el.querySelector(".a-link-normal").getAttribute("href"), productHandle);
                link = baseUrl + link;
            } catch (error) {}
        
            products.push({title,price,link});
        }

        //before while loop restarts, check for 'next' button disable, if not, click it and restart the loop
        isButtonDisabled = await page.$(".a-disabled.a-last") !== null;
        
        if(!isButtonDisabled){
            await page.click(".a-last");
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    await browser.close();
    return products;
}

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}