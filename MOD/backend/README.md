# IIRMIS Backend Microservice

Backend API kwa mfumo wa IIRMIS (Integrated Information Resource Management Information System).

## Teknolojia

- **Node.js** - Runtime
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password Hashing

## Mahitaji

- Node.js 18+
- MongoDB 6+
- npm au yarn

## Kuweka (Installation)

```bash
# Nenda kwenye backend folder
cd backend

# Weka dependencies
npm install

# Nakili na hariri .env file
# (tayari ipo na default settings)

# Weka data ya mfano (optional)
npm run seed

# Anzisha server
npm run dev
```

## Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/iirmis
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## API Endpoints

### Authentication
```
POST   /api/users/login     - Ingia
POST   /api/users/register  - Sajili mtumiaji mpya
GET    /api/users/profile   - Pata wasifu wako
```

### Users
```
GET    /api/users           - Orodha ya watumiaji
GET    /api/users/:id       - Pata mtumiaji mmoja
PUT    /api/users/:id       - Sasisha mtumiaji
DELETE /api/users/:id       - Futa mtumiaji
PUT    /api/users/:id/password - Badilisha password
```

### Assets
```
GET    /api/assets          - Orodha ya mali
GET    /api/assets/:id      - Pata mali moja
POST   /api/assets          - Ongeza mali mpya
PUT    /api/assets/:id      - Sasisha mali
DELETE /api/assets/:id      - Futa mali
PUT    /api/assets/:id/assign - Gawa mali kwa mtumiaji
GET    /api/assets/stats/summary - Takwimu za mali
```

### Maintenance
```
GET    /api/maintenance              - Orodha ya ratiba
GET    /api/maintenance/:id          - Pata ratiba moja
POST   /api/maintenance              - Unda ratiba mpya
PUT    /api/maintenance/:id          - Sasisha ratiba
DELETE /api/maintenance/:id          - Futa ratiba
PUT    /api/maintenance/:id/complete - Kamilisha matengenezo
GET    /api/maintenance/upcoming/:days - Matengenezo yanayokuja
```

### Repair
```
GET    /api/repair              - Orodha ya ukarabati
GET    /api/repair/:id          - Pata oda moja
POST   /api/repair              - Unda oda mpya
PUT    /api/repair/:id          - Sasisha oda
DELETE /api/repair/:id          - Futa oda
PUT    /api/repair/:id/assign   - Gawa fundi
PUT    /api/repair/:id/status   - Badilisha hali
PUT    /api/repair/:id/complete - Kamilisha ukarabati
```

### Store (Inventory)
```
GET    /api/store                     - Orodha ya bidhaa
GET    /api/store/:id                 - Pata bidhaa moja
POST   /api/store                     - Ongeza bidhaa mpya
PUT    /api/store/:id                 - Sasisha bidhaa
DELETE /api/store/:id                 - Futa bidhaa
POST   /api/store/:id/stock-in        - Ingiza hisa
POST   /api/store/:id/stock-out       - Toa hisa
GET    /api/store/:id/transactions    - Historia ya hisa
GET    /api/store/alerts/low-stock    - Bidhaa zenye hisa ndogo
```

### Reports
```
GET    /api/reports           - Orodha ya ripoti
GET    /api/reports/:id       - Pata ripoti moja
POST   /api/reports/generate  - Tengeneza ripoti mpya
GET    /api/reports/:id/download - Pakua ripoti
DELETE /api/reports/:id       - Futa ripoti
```

### Dashboard
```
GET    /api/dashboard/summary          - Muhtasari wa mfumo
GET    /api/dashboard/activities       - Shughuli za hivi karibuni
GET    /api/dashboard/stats/department - Takwimu kwa idara
```

### Health Check
```
GET    /api/health - Angalia hali ya API
```

## Watumiaji wa Mfano

Baada ya kuendesha `npm run seed`:

| Jina | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@iirmis.go.tz | admin123 | admin |
| Manager | manager@iirmis.go.tz | manager123 | manager |
| Technician | tech@iirmis.go.tz | tech123 | technician |
| User | user@iirmis.go.tz | user123 | user |

## Kuendesha

```bash
# Development (na auto-reload)
npm run dev

# Production
npm start
```

## Muundo wa Majibu

### Mafanikio
```json
{
  "success": true,
  "data": {...},
  "count": 10
}
```

### Hitilafu
```json
{
  "success": false,
  "error": "Ujumbe wa hitilafu"
}
```

## CORS

API imeandaliwa kupokea requests kutoka:
- `http://localhost:4200` (Angular dev server)
- `http://127.0.0.1:4200`

## License

ISC
