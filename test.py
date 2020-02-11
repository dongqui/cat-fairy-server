import requests
from bs4 import BeautifulSoup
import datetime


now = datetime.datetime.now()
username = 'dongqui'
r = requests.get(f'https://github.com/{username}?tab=overview&from=2020-02-01&to=2020-02-04')
soup = BeautifulSoup(r.content, 'html.parser')
# print(soup.find(id=f'year-link-{now.year}')['href'])

print(soup.find(class_='js-yearly-contributions').find('h2').text.strip().split(' ')[0])
