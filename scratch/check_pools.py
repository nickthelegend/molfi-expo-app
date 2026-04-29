import requests
import json

url = "https://yields.llama.fi/pools"
response = requests.get(url)
data = response.json()

# Filter for uniswap-v3
uniswap_pools = [p for p in data['data'] if p['project'] == 'uniswap-v3']

# Print first 2 to see structure
print(json.dumps(uniswap_pools[:2], indent=2))
