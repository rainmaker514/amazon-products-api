const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        //defaultViewport: false,
        userDataDir: "./tmp"
    });
    const page = await browser.newPage();
    await page.goto('https://www.amazon.com/gp/bestsellers/electronics/ref=zg_bs_electronics_sm');
    await page.setViewport({
        width: 1200,
        height: 800
    });
    
    
    let items = [];
    let isButtonDisabled = false;
    while(!isButtonDisabled){
        await autoScroll(page);
        // await page.evaluate(() => {
        //     window.scrollTo(0, window.);
        // })
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
            
            items.push({title, price, img});
            
    }
    //await page.waitForSelector(".a-last", {visible: true});
            isButtonDisabled = await page.$(".a-disabled.a-last") !== null;
            if(!isButtonDisabled){
                await page.click(".a-last");
                await new Promise(r => setTimeout(r, 2000));
            }
}

    console.log(items);    
    console.log(items.length);    
    await browser.close();
})();

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