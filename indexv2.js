const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const express = require('express');
const { Console } = require('console');
const app = express();
require('dotenv').config();
const fs = require('fs').promises;
const PORT = process.env.PORT || 8000;
const baseUrl = 'https://www.amazon.com';
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

app.use(express.json());

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
app.get('/', (req, res) => {
    res.json('Welcome to my Amazon Web Scraping API!');
});

app.use('/:name', (req, res, next) => {
    const url = urls.find((url) => url.name === req.params.name);
    if (url) {
        req.urlObject = url;
        next();
    } else {
        res.status(400).json({ error: 'Invalid endpoint' });
    }
});

app.get('/:name', async (req, res) => {
    const url = req.urlObject;
    console.log('Getting pages');
    const htmlPages = await getHTML(url.link);
    console.log('Getting products');
    const results = getProducts(htmlPages);
    console.log('Done!');
    res.json(results);
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.message); 
    res.status(err.status || 500).json({ error: err.message });
});

//gets all html pages and puts them in array
async function getHTML(link){
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: false,
        userDataDir: './tmp',
        args: ['--no-sandbox'],
        //executablePath: '/usr/bin/google-chrome-stable'
        executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath()
    });

    const page = await browser.newPage();
    let htmlPages = [];
    let isButtonDisabled = false;
    let pageCounter = 1;

    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(link);
    
    while(!isButtonDisabled){
        console.log('Scrolling page ' + pageCounter);
        await new Promise(r => setTimeout(r, 2000));
        await autoScroll(page);
        //grab raw html
        const pageData = await page.evaluate(() => {
            return {
                html: document.documentElement.innerHTML
            };
        });

        //putting pages in array for later
        htmlPages.push(pageData);

        const $ = cheerio.load(htmlPages[pageCounter-1].html);
        
        //checking for disabled next button
        const nextButton = $('.a-disabled.a-last');
        
        if (nextButton.text()){//if there is text on the button, meaning if the element with the above selectors exists, the button is disabled
            console.log('link');
            isButtonDisabled = true;
            continue;
        }
        
        let nextPage = baseUrl + $('li.a-last').children('a').attr('href');
        console.log(nextPage);
        
        pageCounter++;

        await page.goto(nextPage);
    }

    console.log('Closing browser');

    await browser.close();
    await cleanUp();

    return htmlPages;
}

function getProducts(htmlPages){
    let products = [];
    let title = 'null';
    let reviews = 'null';
    let price ='null'
    let link = 'null';
    for(let i = 0; i < htmlPages.length; i++){
        const $ = cheerio.load(htmlPages[i].html);
        
        //for each element of this class, i want the title, link and price
        $('.p13n-sc-uncoverable-faceout', htmlPages[i].html).each((i, element) => {
            title = $(element).children('a').text();
            reviews = $(element).find('.a-icon-row').children().attr('title');
            price = $(element).children().last().text();
            link = baseUrl + $(element).children().attr('href');
            
            products.push({title, reviews, price, link});
        });
    }

    return products;  
}

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

async function cleanUp() {
    try {
        // Remove the tmp folder
        await fs.rm('./tmp', { recursive: true });
        console.log('Temporary files and data cleaned up.');
    } catch (error) {
        console.error('Error cleaning up:', error);
    }
}

