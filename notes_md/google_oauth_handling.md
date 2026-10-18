### Handling dupicate null values in google_oauth column in user_table

```bash
docker ps
```

```bash
   docker exec -it centsible-pg psql -U dbadmin -d centsible -c "UPDATE user_table SET google_id = NULL WHERE google_id = '';"
```

I faced one database error, I mistakenly allowed the empty strings into the databse which was designed to not allow duplicates, but multiple empty google auth ids create a conflict, so I made the google id as nullable=True, and also made a change in create_user_with_password() function from user_services.py, excluded google_id from the user_model and saved the user directly making the googlid null in the db

Google id can't be "", but it can be null instead. So, i used this trick.
