#step 1 : postgresql db in the docker

##to create and run the db:
docker run --name centsible-pg -e POSTGRES_USER=dbadmin -e POSTGRES_PASSWORD=password -e POSTGRES_DB=centsible -p 5432:5432 -d postgres:16

##to run the existing db
docker start centsible-pg

using this command to create a new db in the docker. Replace the placeholders like dbadmin and password with your own (optional).

##docker ps to check if the centsible-pg is running

IN the .env, not down these below required db connectors
DATABASE_NAME=centsible
DATABASE_USER=dbadmin
DATABASE_PASSWORD=password
DATABASE_HOST=localhost
