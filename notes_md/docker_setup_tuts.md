### docker compose and docker file definitions

- Dockerfile: This is used for building an image. This will need all the details of an app for building its image. oka image ni build cheyadaniki recipe. Mana own app (FastAPI) ni container lo run cheyalante dani kosam Dockerfile kavali.

- docker-compose.yml: If we ever want to use multiple containers (images) at the same time with a single start/stop command. chala containers ni okesari define chesi, okka command tho start/stop cheyadam.

## Defining a container in a docker-compose:

Compose file lo oka service ela untundi

Meeru already ichina file lo rabbitmq block chudandi. Prathi service lo ivi untayi:

```bash
- image: ae image vadali (eg: postgres:16)

- ports: "laptop_port:container_port". Example "5672:5672"

- environment: settings (eg: username, password)

- volumes: data ni container bayata save cheyadaniki

- healthcheck: container nijanga ready ga undo ledo check

- restart: crash ayite malla start cheyadam
```

we need all the above things to define a container in a docker-compose.
And we won't use the actual values instead we must use from the .env for security purposes.

for example if the postgresql details were something like this in the .env:

```bash
.env:
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=db
```

then the postges service should look like this:

```bash
docker-compose.yml:
environment:
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  POSTGRES_DB: ${POSTGRES_DB}
```

here, nenu postgresql ni mundhu docker lo pull chesi aatharwatha .env lo details add chesanu...kani docker-compose containers ni direct ga create chesthundhi. Mari indhuloni details enti ante manam docker ki ee particular values ni use chesi container create cheyyu ani chepthunnam.

ante, oka kotha service cotnainer create cheyyali ante manaki just dhani user,name,password lanti details kavali anthe. dhani tharwatha kindhi commands run chesthe chalu docker containers create avthayi

```bash
docker-compose up -d
```

containers create ayina tharwatha,

```bash
docker-compose ps
```

ee command run chesthe health check lo anni healthy ani return cheyyali. Appudu docker lo anni services run avthunnayi run artham.

## Volume in service

Volume is the storage provided by the docker for the service container. Postgres lo volume anedhi "- postgres_data:/var/lib/postgresql/data" ila rastham

- redis ki=> - redis_data:/data
- rabbitmq ki=> - rabbitmq_data:/var/lib/rabbitmq

## commands used to delete a service and restart it

```bash
docker compose stop postgres

docker compose rm -f postgres

docker volume ls

docker volume rm backend_postgres_data

docker-compose up -d

docker-compose ps

alembic upgrade head
```
