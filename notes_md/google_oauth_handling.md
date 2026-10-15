### Handling dupicate null values in google_oauth column in user_table

```bash
docker ps
```

```bash
   docker exec -it centsible-pg psql -U dbadmin -d centsible -c "UPDATE user_table SET google_id = NULL WHERE google_id = '';"
```
