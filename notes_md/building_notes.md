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

# Order of pending work:

## Frontned Execution order

Files okadaniki okati depend avtayi, anduke ee order lo cheddam:

1. api/: backend ki calls (inka auth.js, expenses.js migilayi).
2. contexts/: login state, anni pages ki share avtundi.
3. components/ProtectedRoutes/: pages ni login tho protect cheyadam.
4. pages/Auth/: Login, Register, Google callback.
5. App.jsx + routing: pages ni URLs ki connect cheyadam (idi ki react-router-dom install cheyali, appudu cheptha).
6. pages/ForgotPassword, ResetPassword: mee backend email flow tho connect.
7. pages/Expenses + Navbar: main feature.
8. Receipt upload: backend importer ayyaka.

## Backend order (suggestion)

Frontend core (Oct 20 varaku)
Receipt importer (R2 + OpenRouter)
Redis rate limiting (chinna, importer ki kuda protect chestundi)
Dashboard endpoint + caching
Dockerfile
Deploy
