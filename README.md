# SSVT Coaching Website

Two-panel website for SSVT Coaching, Jaiptana:

- Public pages: Home, About, Contact, Student Data
- Admin panel: toppers, event pictures, reviews, and test results
- Local storage fallback: `data/db.json`
- Production storage: MongoDB when `MONGODB_URI` is set

## Run Locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

If `MONGODB_URI` is not set, the app uses local JSON data. If `MONGODB_URI` is set, it uses MongoDB.

## MongoDB Setup

Create a MongoDB Atlas cluster, then copy the connection string. Add these environment variables:

```text
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/ssvt_coaching?retryWrites=true&w=majority
MONGODB_DB_NAME=ssvt_coaching
SEED_DATABASE=true
CORS_ORIGINS=*
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_SESSION_HOURS=12
```

`SEED_DATABASE=true` adds the starter topper/event/review/test data only when all MongoDB collections are empty. Set it to `false` if you want an empty database.

`CORS_ORIGINS=*` allows a frontend hosted on GitHub Pages or another domain to call the Render backend. For tighter security, replace `*` with your exact frontend URL.

`ADMIN_PASSWORD` is required for the admin panel. Set it in Render environment variables, not in the code.

## Render Deployment

1. Push this folder to a GitHub repository.
2. In Render, create a new Web Service from that repository.
3. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: Node
4. Add the environment variables from the MongoDB setup section.
5. Deploy.

The included `render.yaml` can also be used as a Render blueprint.

## GitHub Upload

```bash
git init
git add .
git commit -m "Initial SSVT coaching website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not commit `.env`, `node_modules`, or uploaded local data. They are ignored by `.gitignore`.
