# GaavConnect Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
cd "c:\Users\USER\Downloads\GaavConnect PRD Review"
npm install
```

### Step 2: Create Environment File (1 min)
Create `.env` file in root directory:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAI_pLRHXEBPfwBLnFHfLpJHVLRRVnp_fE
```

**Don't have Supabase?**
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name it "GaavConnect"
4. Copy Project URL and anon key

### Step 3: Start Dev Server (1 min)
```bash
npm run dev
```

Visit: `http://localhost:3000`

### Step 4: Test Login (1 min)
1. Click "Sign Up"
2. Enter any email/password
3. You're in! 🎉

### Step 5: Try Route Optimization (1 min)
1. Click "Plan Your Journey"
2. Type "Rampur" as origin
3. Add stops: "Sundarpur", "Madhavpur"
4. Click "Optimize Route"
5. Watch the TSP algorithm run!

---

## 📋 What Works Now

✅ User authentication
✅ Route optimization with real TSP solver
✅ Route saving to database
✅ Crowd reporting
✅ Offline support
✅ Real village coordinates
✅ Multi-modal transport

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot find module @supabase/supabase-js"
**Fix**: `npm install @supabase/supabase-js`

### Issue: "Environment variables not loaded"
**Fix**: Restart dev server after creating `.env`

### Issue: "Map not showing"
**Fix**: Verify Google Maps API key is valid

### Issue: "Routes not saving"
**Fix**: Verify Supabase credentials in `.env`

---

## 📚 Documentation

- `README.md` - Full feature documentation
- `IMPLEMENTATION.md` - Technical implementation details
- `COMPLETION_SUMMARY.md` - Project completion report

---

## 🎯 Next Steps

1. **Setup Supabase** (if not done)
   - Create tables from SQL provided in README.md
   - Enable RLS policies

2. **Test Features**
   - Create account
   - Plan a route
   - Submit crowd report
   - Try offline mode

3. **Customize**
   - Change colors in Tailwind config
   - Add your own villages
   - Adjust algorithm parameters

4. **Deploy**
   - Build: `npm run build`
   - Deploy to Vercel/Netlify/Docker

---

## 💻 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

---

## 🎨 Customization

### Add New Villages
Edit `src/utils/villages.ts`:
```typescript
{
  name: "YourVillage",
  lat: 23.1234,
  lng: 79.5678,
  state: "MP",
  region: "Central"
}
```

### Change Colors
Edit Tailwind colors in your config:
- `#6A0DAD` - Primary purple
- `#8B2DC2` - Dark purple
- `#CBA0F5` - Light purple

### Adjust Transport Modes
Edit `src/utils/distance.ts`:
```typescript
const transportModes = {
  walk: { speed: 4, farePerKm: 0, fareBase: 0 },
  // ... modify as needed
}
```

---

## 📱 Features at a Glance

### Route Planning
- Select origin and destinations
- Genetic algorithm optimization
- Real-time distance calculation
- Multi-modal routing suggestions
- Cost & duration estimation

### Crowd Reports
- Submit crowd density reports
- View community reports in real-time
- Upvote helpful reports
- Filter by location and severity

### User Account
- Email/password authentication
- Save route history
- Access recent routes
- Offline route caching

### Maps
- Interactive route visualization
- Stop markers
- Polyline routes
- Click-to-select locations

---

## 🔐 Security Note

The app uses:
- Supabase authentication (secure)
- Row-level security on database
- HTTPS in production
- Service worker for offline (secure cache)

For production:
1. Use HTTPS only
2. Keep API keys secret
3. Enable CORS properly
4. Set up rate limiting
5. Monitor for suspicious activity

---

## 📊 Example Routes

Try these pre-made routes:

**Route 1**: Rampur → Sundarpur → Madhavpur
- Distance: ~42 km
- Estimated cost: ₹250-350
- Time: ~90 minutes (by bus)

**Route 2**: Sundarpur → Laxmipur → Ganeshpur
- Distance: ~38 km
- Estimated cost: ₹220-300
- Time: ~85 minutes (mixed transport)

**Route 3**: Ramgarh → Vidyanagar → Shivpuri
- Distance: ~32 km
- Estimated cost: ₹180-250
- Time: ~75 minutes

---

## 🤝 Contributing

Want to improve GaavConnect?

1. Fork or clone the repo
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit improvements

Areas for contribution:
- Additional villages
- More transport modes
- Algorithm optimizations
- UI improvements
- Translations

---

## 📞 Quick Support

### Can't log in?
- Check email spelling
- Verify password
- Ensure Supabase is configured

### Routes not optimizing?
- Verify at least 1 stop is added
- Check villages exist
- Look for console errors

### Map not loading?
- Verify Google Maps API key
- Check internet connection
- Check geolocation permissions

### Data not saving?
- Verify Supabase tables exist
- Check RLS policies
- Look for auth errors

---

## ✨ Pro Tips

1. **Use keyboard shortcuts**
   - Enter to add stop
   - Esc to close dialogs

2. **Test offline mode**
   - Open DevTools
   - Go to Network tab
   - Check "Offline"
   - Try using app

3. **Optimize performance**
   - Keep stops under 15
   - Close unused tabs
   - Clear browser cache

4. **Enable location**
   - Allow geolocation
   - Get nearby routes
   - See relevant reports

---

## 🎓 Learn More

### TypeScript & React
- `src/App.tsx` - App routing structure
- `src/contexts/AuthContext.tsx` - Auth pattern
- `src/components/Home.tsx` - Component composition

### Algorithms
- `src/utils/tspSolver.ts` - Genetic algorithm
- `src/utils/distance.ts` - Haversine formula
- `src/utils/directions.ts` - Polyline decoding

### Backend Integration
- `src/utils/supabase.ts` - Database operations
- `src/utils/offline.ts` - Offline support
- `public/sw.js` - Service worker

---

## 🏁 Ready to Go?

1. ✅ Dependencies installed
2. ✅ Environment configured
3. ✅ Dev server running
4. ✅ Ready to code!

**Start coding at**: `http://localhost:3000`

---

## 📖 Full Documentation

Need more details?
- Read `README.md` for complete feature list
- Check `IMPLEMENTATION.md` for technical specs
- Review `COMPLETION_SUMMARY.md` for project status

---

## 🎉 Happy Coding!

GaavConnect is ready to help rural communities optimize their routes.

Questions? Check the docs or look at the code - it's well commented!

Good luck! 🚀
