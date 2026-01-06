# 🚀 StoryBoard Plus - Production Deployment Guide

**Platform:** Vercel (Optimized for Next.js)  
**Time Required:** 5-10 minutes  
**Cost:** FREE (Hobby tier)

---

## ✅ **Pre-Deployment Checklist**

- ✅ Build passing (Exit code: 0)
- ✅ TypeScript clean (No errors)
- ✅ All features tested
- ✅ Vercel CLI installed

---

## 📋 **Deployment Steps**

### **Option 1: CLI Deployment (Recommended)**

1. **Login to Vercel**
   ```bash
   vercel login
   ```
   - Opens browser for authentication
   - Choose GitHub, GitLab, or email
   - Authorize Vercel

2. **Deploy to Production**
   ```bash
   vercel --prod
   ```
   
3. **Answer Prompts:**
   ```
   ? Set up and deploy "storyboard_plus"? [Y/n] Y
   ? Which scope? [Your Account]
   ? Link to existing project? [N]
   ? What's your project's name? storyboard-plus
   ? In which directory is your code located? ./
   ```

4. **Wait for Deployment** (~2 minutes)
   ```
   🔗  Preview: https://storyboard-plus-xyz.vercel.app
   ✅  Production: https://storyboard-plus.vercel.app
   ```

5. **Done!** 🎉
   - Your app is live at the provided URL
   - Automatic HTTPS enabled
   - CDN distribution worldwide

---

### **Option 2: GitHub Integration (Most Popular)**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - StoryBoard Plus"
   git remote add origin https://github.com/YOUR_USERNAME/storyboard-plus.git
   git push -u origin main
   ```

2. **Connect Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repo
   - Click "Deploy"

3. **Automatic Deployments**
   - Every push to `main` = auto-deploy
   - Preview deployments for PRs
   - Rollback with one click

---

## 🔧 **Environment Variables**

If you need to add environment variables (Google API keys, etc.):

### **Via CLI:**
```bash
vercel env add NEXT_PUBLIC_GOOGLE_API_KEY
```

### **Via Dashboard:**
1. Go to project settings
2. Navigate to "Environment Variables"
3. Add:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GOOGLE_API_KEY`
4. Redeploy

**Note:** All public env vars MUST start with `NEXT_PUBLIC_`

---

## 🌐 **Custom Domain Setup**

### **Free Vercel Domain:**
- `storyboard-plus.vercel.app` (included)

### **Custom Domain:**
1. Go to Project Settings → Domains
2. Add your domain (e.g., `storyboard.app`)
3. Update DNS records as instructed:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
4. Wait 5-10 minutes for DNS propagation
5. Automatic SSL certificate issued

**Recommended Registrars:**
- [Namecheap](https://namecheap.com) (~$10/year)
- [Google Domains](https://domains.google) (~$12/year)
- [Cloudflare](https://cloudflare.com) (~$10/year)

---

## 📊 **Post-Deployment Validation**

### **1. Test Core Features:**
- ✅ Editor loads
- ✅ Typing works
- ✅ Command Palette (Ctrl+K)
- ✅ Google Drive integration
- ✅ Export functionality
- ✅ Analysis tools

### **2. Run Lighthouse Audit:**
```bash
# Chrome DevTools
1. Open deployed site
2. F12 → Lighthouse tab
3. Run audit

Target Scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+
```

### **3. Test on Devices:**
- Desktop (Chrome, Firefox, Safari)
- Mobile (iOS Safari, Chrome Android)
- Tablet (iPad, Android)

---

## 🔄 **Continuous Deployment**

Once deployed, every code change is easy:

1. **Make changes locally**
   ```bash
   # Edit files
   npm run build  # Test locally
   ```

2. **Deploy updates**
   ```bash
   vercel --prod
   ```
   OR (if using GitHub)
   ```bash
   git add .
   git commit -m "Add new feature"
   git push
   ```

3. **Automatic Deployment**
   - Vercel detects changes
   - Builds automatically
   - Deploys in ~2 minutes
   - Zero downtime

---

## 📈 **Analytics & Monitoring**

### **Built-in Vercel Analytics (FREE):**
1. Enable in project settings
2. See:
   - Page views
   - User locations
   - Performance metrics
   - Error tracking

### **Optional: Google Analytics**
Add to `src/app/layout.tsx`:
```tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
```

---

## 🐛 **Troubleshooting**

### **Build Fails:**
```bash
# Test build locally first
npm run build

# Check logs
vercel logs
```

### **Environment Variables Not Working:**
- Ensure they start with `NEXT_PUBLIC_`
- Redeploy after adding
- Check capitalization

### **404 on Custom Domain:**
- DNS propagation takes 5-60 minutes
- Verify CNAME records with `dig` command
- Check Vercel domain settings

### **Slow Load Times:**
- Check Vercel Analytics for bottlenecks
- Optimize images (use Next.js Image component)
- Enable compression in next.config.js

---

## 💰 **Pricing**

### **Vercel Hobby (FREE):**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains (unlimited)
- ✅ Preview deployments
- ❌ No commercial use

### **Vercel Pro ($20/month):**
- ✅ Everything in Hobby
- ✅ Commercial use allowed
- ✅ 1TB bandwidth/month
- ✅ Priority support
- ✅ Advanced analytics

**For Personal Projects:** Hobby tier is perfect  
**For Business:** Upgrade to Pro when monetizing

---

## 🎯 **Quick Start Command**

**Deploy right now:**
```bash
cd c:\Users\Hauve\.gemini\antigravity\scratch\storyboard_plus
vercel --prod
```

**Expected Output:**
```
Vercel CLI 33.0.0
🔍  Inspect: https://vercel.com/[username]/storyboard-plus/[id]
✅  Production: https://storyboard-plus.vercel.app [2m]
```

---

## 📚 **Additional Resources**

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Custom Domains Guide](https://vercel.com/docs/concepts/projects/domains)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✨ **Success Checklist**

- [ ] Vercel account created
- [ ] Project deployed
- [ ] Live URL accessible
- [ ] All features working
- [ ] Lighthouse score 90+
- [ ] Mobile-friendly (optional)
- [ ] Custom domain added (optional)
- [ ] Analytics enabled (optional)

---

**🎊 Congratulations! Your app is now LIVE and accessible worldwide!**

**Share Link:** `https://storyboard-plus.vercel.app`

---

**Questions or Issues?**  
Check the troubleshooting section or Vercel's excellent documentation.
