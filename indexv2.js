const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
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

app.get('*', async (req, res, next) => {
    //finds url in array based on request url params
    const url = urls.find((url) => url.name === req.url.replace('/', ''));

    if(url === undefined){//checks if url exists in array, if not create and pass an error to handler
        const error = new Error('Invalid endpoint');
        error.status = 400;
        next(error);
    }else{//if exists, call handler to handle valid endpoints 
        next();
    }
});

//valid endpoint handler
app.get('*', async (req, res, next) => {
    const url = urls.find((url) => url.name === req.url.replace('/', ''));
    console.log('Getting products...');
    //const results = await getProducts(url.link);
    const htmlPages = await getHTML(url.link);
    const results = getProducts(htmlPages);
    console.log('Done!');
    res.json(htmlPages);
});

//error handler
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(err.status).json({error: err.message});
    next();
});
/*
puppet launches
goes to link
grabs raw html
add html page to array
use cheerio to parse html
enter while loop
grab pagination, check if a-last is disabled
if not grab link from it and make puppet go to that link and restart loop
exit loop
grab product data using for loop
return
*/
async function getHTML(link){
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
        userDataDir: './tmp',
        args: ['--no-sandbox'],
        //executablePath: '/usr/bin/google-chrome-stable'
        executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath()
    });

    const page = await browser.newPage();
    let htmlPages = [];
    let baseUrl = 'https://www.amazon.com';
    let isButtonDisabled = false;
    let pageCounter = 0;

    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(link);

    while(!isButtonDisabled){
        await autoScroll(page);
        //grab raw html
        const pageData = await page.evaluate(() => {
            return {
                html: document.documentElement.innerHTML
            };
        });

        //putting pages in array for later
        htmlPages.push(pageData);

        const $ = cheerio.load(htmlPages[pageCounter].html);
        
        //checking for disabled next button
        const nextButton = $('.a-disabled.a-last');
        
        if (nextButton.text()){//if there is text on the button, meaning if the element with the above selectors exists, the button is disabled
            isButtonDisabled = true;
            continue;
        }
        
        let nextPage = baseUrl + $('.a-last').children('a').attr('href');
        
        pageCounter++;

        await page.goto(nextPage);
    }

    await browser.close();
    
    return htmlPages;
}

function getProducts(htmlPages){
    let products = [];
    let data;
    for(let i = 0; i < htmlPages.length; i++){
        const $ = cheerio.load(htmlPages[1].html);
        
        $()
    }

    return data;
}

// async function getProducts(link){
//     const browser = await puppeteer.launch({ 
//         //headless: false,
//         defaultViewport: false,
//         userDataDir: './tmp',
//         args: ['--no-sandbox'],
//         //executablePath: '/usr/bin/google-chrome-stable'
//         executablePath: process.env.NODE_ENV === 'production' ? process.env. PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath()
//     }); 

//     const page = await browser.newPage();
//     await page.setViewport({width: 1200, height:800});

//     let isButtonDisabled = false;
//     let products = [];
    
//     await page.goto(link);

//     while (!isButtonDisabled) { //checking if 'next' button is disabled, if it is, job is done
//         //await autoScroll(page);
//         const productHandles = await page.$$('.p13n-gridRow._cDEzb_grid-row_3Cywl > .a-column.a-span12.a-text-center._cDEzb_grid-column_2hIsc');

//         for (const productHandle of productHandles) {
//             let title = "null";
//             let price = "null";
//             let link = "null";
//             const baseUrl = 'https://www.amazon.com';

//             try {
//                 title = await page.evaluate(el => el.querySelector("span > div").textContent, productHandle);
//             } catch (error) { }

//             try {
//                 price = await page.evaluate(el => el.querySelector("span > span").textContent, productHandle);
//             } catch (error) { }

//             try {
//                 link = await page.evaluate(el => el.querySelector(".a-link-normal").getAttribute("href"), productHandle);
//                 link = baseUrl + link;
//             } catch (error) { }

//             products.push({ title, price, link });
//         }
//         //
//         //before while loop restarts, check for 'next' button disable, if not, click it and restart the loop
//         isButtonDisabled = await page.$("li.a-disabled.a-last") !== null;
//         console.log(isButtonDisabled);
//         if (!isButtonDisabled) {
            
//             await page.click('li.a-last');
//             await new Promise(r => setTimeout(r, 10000));
//         }
//     }
    
//     await browser.close();
//     return products;
// }

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}