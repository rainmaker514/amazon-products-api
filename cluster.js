const fs = require('fs');
const {Cluster} = require('puppeteer-cluster');
const urls = ['https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/ref=zg_bs_pg_1_electronics?_encoding=UTF8&pg=1', 'https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/ref=zg_bs_pg_2_electronics?_encoding=UTF8&pg=2'];

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 100,
        monitor: true,
        puppeteerOptions:{
            userDataDir: "./tmp"
        }
    });

    //a listener in case of error
    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });

    fs.writeFile('results.csv', 'title,price,image', err => {
        if(err) throw err;
    });

    //starts tasks with given params
    await cluster.task(async({page, data: url}) => {
        await page.goto(url);
        await page.setViewport({width: 1200, height: 800});
        await autoScroll(page);
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
            
            fs.appendFile('results.csv', `\n${title.replace(/,/g, ".")},${price},${img}`, err => {
                if(err) throw err;
            });
        }
    });
    
    //queues up urls for tasks
    for(const url of urls){
        await cluster.queue(url);
    }

    await cluster.idle();
    await cluster.close();
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