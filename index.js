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
        let title = "null";
        let price = "null";
        let img = "null";

        try {
            title = await page.evaluate(el => el.querySelector("span > div").textContent, productHandle);
        } catch (error) {}

        try {
            price = await page.evaluate(el => el.querySelector("span > span").textContent, productHandle);
        } catch (error) {}
        
        try {
            img = await page.evaluate(el => el.querySelector(".a-dynamic-image.p13n-sc-dynamic-image.p13n-product-image").getAttribute("src"), productHandle);
        } catch (error) {}
        
        console.log(title, price, img);
    }
    
    await browser.close();
})();