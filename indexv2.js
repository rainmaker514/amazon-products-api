const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const urls = [
    {
        name: 'all', 
        link: 'https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/ref=zg_bs_unv_electronics_1_10048700011_1'
    }
];

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
app.get('/', (req, res) => {
    res.json('Welcome to my Amazon Web Scraping API!');
});

app.get('/all', async(req, res) => {
    const url = urls.find((url) => url.name === 'all');
    let results = await getAllProducts(url.link);
    res.json(results);
});

async function getAllProducts(link){
    const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: false,
        userDataDir: "./tmp",
    });

    const page = await browser.newPage();
    await page.goto(link);
    await page.setViewport({width: 1200, height: 800});
    await autoScroll(page);
    const productHandles = await page.$$('.p13n-gridRow._cDEzb_grid-row_3Cywl > .a-column.a-span12.a-text-center._cDEzb_grid-column_2hIsc');
    let products = [];

    for(const productHandle of productHandles){ 
        let title = "null";
        let price = "null";
        let link = "null";

        try {
            title = await page.evaluate(el => el.querySelector("span > div").textContent, productHandle);
        } catch (error) {}

        try {
            price = await page.evaluate(el => el.querySelector("span > span").textContent, productHandle);
        } catch (error) {}
            
        try {
            link = await page.evaluate(el => el.querySelector(".a-link-normal").getAttribute("href"), productHandle);
        } catch (error) {}
        
        products.push({title,price,link});
    }
    // console.log('done');
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