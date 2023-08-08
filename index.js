const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        userDataDir: "./tmp"
    });
    const page = await browser.newPage();
    await page.goto('https://www.amazon.com/gp/bestsellers/electronics/ref=zg_bs_electronics_sm');
    await page.setViewport({
        width: 1200,
        height: 800
    });
    
    let isButtonDisabled = false;
    let products = [];
    //creating csv
    fs.writeFile('results.csv', 'title,price,image', err => {
        if(err) throw err;
    });
    while(!isButtonDisabled){ //checking if 'next' button is disabled, if it is, job is done
        await autoScroll(page);//function that scrolls through page to load all items
        const productHandles = await page.$$('.p13n-gridRow._cDEzb_grid-row_3Cywl > .a-column.a-span12.a-text-center._cDEzb_grid-column_2hIsc');
        
        //gets each product and adds info to file with each iteration, if a field is missing it will automatically be 'null' 
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
            
            fs.appendFile('results.csv', `\n${title.replace(/,/g, ".")},${price},${img}`, err => {
                if(err) throw err;
            });
            products.push({title,price,img});
            console.log(products);
        }
        
        //before while loop restarts, check for 'next' button disable, if not, click it and restart the loop
        isButtonDisabled = await page.$(".a-disabled.a-last") !== null;
        
        if(!isButtonDisabled){
            await page.click(".a-last");
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    
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