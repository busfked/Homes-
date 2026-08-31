# Bese Home Solutions | ቤሴ የቤት መፍትሄ (Addis Ababa Broker Platform)

A streamlined, modern broker web application designed specifically for Addis Ababa, Ethiopia. It connects house seekers directly with verified property owners while providing automated 7-day auto-expiry data management, instant photo compression (low KB storage), and a direct admin review & approval flow.

---

## 🌟 Key Features

1. **Focused on Homes with Upcoming Expansion**:
   - **Active Catalog**: Verified Apartments, Condominiums, Villas, G+1/G+2, Studios, and Commercial properties across all Addis Ababa neighborhoods (Bole, Gerji, Bulbula, Megenagna, CMC, Ayat, Summit, Sarbet, Kazanchis, Piassa, Lebu, Jemo, Gotera, etc.).
   - **Cars & Heavy Machinery**: Cleanly tagged as "Coming Soon / በቅርብ ቀን" with preview cards, preserving the focused real-estate experience while teasing future multi-category support.

2. **Detailed User Search & Filtering Menu**:
   - Keyword search across neighborhood landmarks, building names, and descriptions.
   - Quick Area Pills (Bole, Gerji, Bulbula, Megenagna, CMC, etc.).
   - 6-part filter grid: Neighborhood/Sub-City, Property Type, Rent vs Sale, Bedrooms (Studio, 1, 2, 3, 4+), Max Budget (ETB), and Available Only toggle.

3. **Two-Tier Monetization & Direct Owner Unlock**:
   - **Rent Unlock Fee**: 100 ETB (Telebirr, CBE, Awash, CBE Birr screenshot verification).
   - **Sale Unlock Fee**: 500 ETB.
   - **Seller Listing Fee for Sale Properties**: 500 ETB payment screenshot submitted during posting, approved by admin before appearing live. Free for rent properties.
   - **Dashboard Privacy**: Prices are hidden from the initial summary cards to protect broker value and incentivize verified unlocks.

4. **Automated Storage & Space Optimization**:
   - **Instant Image Compression**: Client-side canvas compression reduces 3-10MB mobile camera photos down to ~30-70 KB without quality loss.
   - **7-Day Auto-Expiration**: Listings automatically expire after 7 days unless renewed by the owner with their 4-digit PIN on days 5-6 ("Still Available").
   - **1-Click Auto-Cleanup**: Admin can purge expired listings with a single click to save Supabase/database quota.

5. **Dual Language & Dark/Light Mode**:
   - Complete Amharic (አማርኛ) and English localization.
   - Full dark mode and light mode toggle with local preference memory.

6. **Admin Panel & Owner Self-Service Portal**:
   - **Admin Panel** (Default PIN: `1234`): Review payment screenshots, approve/reject unlock requests, approve seller listings, modify bank account details, and set custom fees.
   - **Owner Portal**: Owners can mark properties as "Occupied / ተከራይቷል/ተሽጧል" once deal is completed, or renew active listings.

---

## 🚀 How to Deploy on Vercel & GitHub (Free Tier)

This app is built as a standard, self-contained React + TypeScript + Vite application. It has **no proprietary or hidden API keys** and will build and deploy cleanly on any host.

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Bese Home Solutions"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

### 2. Deploy on Vercel (100% Free)
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your GitHub repository.
3. Framework Preset will auto-detect as **Vite**.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

### 3. Deploy on Render (Alternative Free Hosting)
1. Go to [render.com](https://render.com) and create a new **Static Site**.
2. Connect your GitHub repository.
3. Build Command: `npm run build`
4. Publish Directory: `dist`
5. Click **Create Static Site**.

---

## ⚙️ Development & Local Testing

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run TypeScript lint check
npm run lint

# Build for production
npm run build
```
