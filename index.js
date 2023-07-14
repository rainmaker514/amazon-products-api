const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        //headless: false,
        defaultViewport: false,
        userDataDir: "./tmp"
    });
    const page = await browser.newPage();
    await page.goto('https://www.amazon.com/gp/bestsellers/electronics/ref=zg_bs_electronics_sm');
    const productHandles = await page.$$('.p13n-gridRow._cDEzb_grid-row_3Cywl > .a-column.a-span12.a-text-center._cDEzb_grid-column_2hIsc');
    
    for(const productHandle of productHandles){
        const title = await page.evaluate(el => el.querySelector("span > div").textContent, productHandle);
        console.log(title);
    }
    
    await browser.close();
})();