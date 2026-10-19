## Important:

Backend URL ni direct ga app lo vadakudadhu; .env lo URL add chesi dhanni vadali

```bash
VITE_API_URL=http://backend_url.com/api/v1
```

## connecting apis to the backend

Manam Frontend ni backend tho connect cheyyadaniki fetch() ni vadutham dheeni functioning python lo ni requests functioning ki similar ga untundhi

```python
import requests

requests.post("http://localhost:8000/api/v1/auth/logout")
```

Python lo ila requests use chesi API ki suitable method(get,post,etc) ni vaadi request pamputham
Similar ga:

```javascript
fetch("http://localhost:8000/api/v1/auth/logout", { method: "POST" });
```

JS lo fetch vaadi api url ni string parameter la send chesi method ni pamputham.

## API Fetch

Mana frontend lo prathi chota fetch and direct API URL parameter vadatam good practice kadhu andhukani manam apiFetch ane async function vadutham. Dheeni valla manam only required URL part send chesthe chalu. Repeated coding avasaram ledhu

frontend/src/api/index.js:

```javascript
const API_URL = import.meta.env.VITE_API_URL;

export async apiFetch(path,options = {}) {
    const res = await fetch(API_URL + path,{credentials:"include",...options})

    if (!res.ok){
        throw new Error("Request failed"+res.status)
    }

    return res.json()
}
```

ikkada ...options works same as \*\*options in python, to get the data from a dict

```javascript
apiFetch() function usage example:

import { apiFetch } from "./index";

export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}
```

## JSON.stringify and URLSearchParams():

Ee rendu kuda information ni backend API suitable format lo change cheyyadaniki vadutham, JSON.stringify vadithe data JSON format lo untundhi, URLSearchParams vadithe data HTML ki suitable formatlo return chesthundhi. Overall use okate kani returning formats veru

If an API's request body in swagger UI says:

- application/json: then we use JSON.stringify + Content-Type
- application/x-www-form-urlencoded: then we use URLSearchParams()

## Overall frontend architecture:

main.jsx (start)
->
App.jsx (URL mapping)
->
pages/Login.jsx (oka screen) <- components/Navbar.jsx (chinna UI part)
->
api/auth.js (backend call) The main URL stays in here, this needs to be triggered/called
->
api/index.js (fetch)
->
backend

An api/<file_name>.js file function can be triggered by a button or by the useEffect

// onChange typing ni detect chestundi
// useState value ni gurthupettukuntundi (memory)
// setEmail value ni marchi, screen update cheyistundi
