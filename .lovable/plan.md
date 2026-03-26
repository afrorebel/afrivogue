

# Grant Admin Role to User

## What
Insert a row into `user_roles` to give user `abraham` (ID: `9ee2a495-0396-41fa-b2fc-ad1df8d8ea4b`) the `admin` role.

## How
Single SQL insert into `user_roles`:
```sql
INSERT INTO user_roles (user_id, role) VALUES ('9ee2a495-0396-41fa-b2fc-ad1df8d8ea4b', 'admin');
```

## Result
After this, navigating to `/admin` will grant full access to the admin dashboard with all CMS tabs (Trends, Forecasts, Trivia, Moodboard, Users, Site Settings).

