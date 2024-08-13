import math
import time

import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

def getModel(name):
    if '4060 Ti' in name: return '4060 Ti'
    if '4060' in name: return '4060'
    if '4070 Ti' in name: return '4070 Ti'
    if '4070' in name: return '4070'
    if '4080' in name: return '4080'
    if '4090' in name: return '4090'

headers = {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"}

url = 'https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=1&page_size=100&facet_filters=eyJHZUZvcmNlIFJUWCBTw6lyaWUgNDAiOlsiUlRYIDQwNjAiLCJSVFggNDA2MCBUaSIsIlJUWCA0MDcwIiwiUlRYIDQwNzAgVGkiLCJSVFggNDA4MCIsIlJUWCA0MDkwIl19&sort=most_searched'

options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)

driver.get(url)

time.sleep(2)

soup = BeautifulSoup(driver.page_source, 'html.parser')

qtdProducts = soup.find('div', id='listingCount').get_text().strip()
qtdProducts = int(qtdProducts[:qtdProducts.find(" ")])

productsByPage = 100

qtdPages = math.ceil(qtdProducts/ productsByPage)

total_products = []

kabum_url = 'https://www.kabum.com.br/hardware/placa-de-video-vga';
for page in range(1, qtdPages+1):
    urlPage = f'{kabum_url}?page_number={page}&page_size=100&facet_filters=eyJHZUZvcmNlIFJUWCBTw6lyaWUgNDAiOlsiUlRYIDQwNjAiLCJSVFggNDA2MCBUaSIsIlJUWCA0MDcwIiwiUlRYIDQwNzAgVGkiLCJSVFggNDA4MCIsIlJUWCA0MDkwIl19&sort=most_searched'
    driver.get(url)
    time.sleep(2)

    soup = BeautifulSoup(driver.page_source, 'html.parser')

    site = requests.get(urlPage, headers=headers)
    products = soup.find_all('article', class_=re.compile('productCard'))

    for product in products:
        name = product.find('span', class_=re.compile('nameCard')).get_text().replace('Placa de Vídeo ', '')
        price = product.find('span', class_=re.compile('priceCard')).get_text().replace('R$\xa0', '').replace('.', '').replace(',', '.')
        total_products.append({
            "model": getModel(name),
            "name": name,
            "price": price
        })

df = pd.DataFrame(total_products)
json = df.to_json(orient='records', lines=True)

url = "http://app:3030/save/products"  # "node-server" é o nome do serviço Node.js no Docker Compose

response = requests.post(url, json=total_products)


