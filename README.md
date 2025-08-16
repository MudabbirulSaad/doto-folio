# SAAD - Portfolio Website

A modern, responsive portfolio website for **Mudabbirul Saad** - AI Student & Developer at Swinburne University of Technology. Built with Next.js 15, React 19, and shadcn/ui components featuring advanced animations, form handling, and professional design.

## 🚀 Features

### ✨ Design & Branding
- **Brand Identity**: "SAAD" as the primary brand name
- **Professional Typography**: Custom font stack with Doto (sans-serif) and Besley (serif)
- **Dark Theme**: Modern dark theme with carefully crafted color palette
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Liquid Glass Effects**: Advanced CSS glassmorphism with realistic edge depth
- **Reveal Card System**: Microsoft Fluent Design-inspired reveal effects

### 🧭 Navigation
- **Fixed Header**: Sticky navigation bar with backdrop blur effect
- **Desktop Navigation**: Horizontal menu with smooth hover transitions
- **Mobile Navigation**: Hamburger menu with slide-out panel using shadcn/ui Sheet component
- **Smooth Scrolling**: JavaScript-powered smooth scrolling to sections
- **CTA Buttons**: "View Resume" (primary) and "Blog" (secondary) buttons
- **Footer Navigation**: Complete site navigation in footer

### 📱 Responsive Breakpoints
- **Mobile**: 320px+ (hamburger menu, stacked layout)
- **Tablet**: 768px+ (transitional layout)
- **Desktop**: 1024px+ (full horizontal navigation)

### 🎨 Hero Section
- **Full Viewport Height**: 100vh with proper content positioning
- **Lower-Left Alignment**: Content positioned in lower-left corner with generous padding
- **Scalable Typography**: Responsive text sizing from 4xl to 8xl
- **Interactive CTA**: "Explore My Work" button with smooth scroll to Projects section
- **Unicorn Studio Background**: Interactive 3D background animation

### 📄 Content Sections
- **About**: Personal background, education, and approach
- **Projects**: Portfolio showcase with technology tags and status indicators
- **Skills**: Comprehensive technical skills organized by category
- **Contact**: Multiple contact methods with social media links
- **Contact Form**: Functional contact form with validation and feedback
- **Footer**: Professional footer with navigation and social links

## 🛠 Tech Stack

- **Framework**: Next.js 15.4.6 with App Router
- **React**: React 19.1.0
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: shadcn/ui (Button, Navigation Menu, Sheet, Form, Input, Textarea, Label)
- **TypeScript**: Full TypeScript support
- **Icons**: Lucide React icons
- **Fonts**: Next.js font optimization with Google Fonts
- **Animations**: Custom CSS animations with GSAP-style easing
- **Background**: Unicorn Studio 3D interactive background
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Email Service**: Nodemailer with Gmail SMTP
- **Email Templates**: Professional HTML templates with responsive design
- **Admin System**: Secure admin dashboard with authentication and contact management

## 📦 Dependencies

### Core Dependencies
```json
{
  "next": "15.4.6",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "tailwindcss": "^4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^0.539.0",
  "tailwind-merge": "^3.3.1",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/ssr": "^0.1.0",
  "nodemailer": "^6.9.8",
  "@types/nodemailer": "^6.4.14"
}
```

### shadcn/ui Components Used
- `Button` - Primary and secondary call-to-action buttons
- `Navigation Menu` - Desktop navigation structure
- `Sheet` - Mobile hamburger menu implementation
- `Input` - Form input fields with validation
- `Textarea` - Multi-line text input for messages
- `Label` - Accessible form labels
- `Form` - Form handling and validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Set up environment variables**
   Copy the example environment file and add your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local` with your Supabase project details:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the portfolio.

## 🗄️ Supabase Backend Setup

This portfolio uses Supabase as the backend service for contact form submissions and potential future features like visitor analytics.

### Prerequisites
- A Supabase account (free tier available)
- Basic understanding of PostgreSQL

### 1. Create Supabase Project

1. **Sign up/Login** to [Supabase](https://supabase.com)
2. **Create a new project**:
   - Choose your organization
   - Enter project name (e.g., "portfolio-website")
   - Set a strong database password
   - Select your preferred region

3. **Wait for setup** (usually takes 1-2 minutes)

### 2. Database Schema Setup

Navigate to the SQL Editor in your Supabase dashboard and run the following SQL:

```sql
-- Create contact_submissions table
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public contact form submissions
CREATE POLICY "Enable insert for all users" ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Restrict reading to authenticated users only (for admin access)
CREATE POLICY "Enable read for authenticated users only" ON contact_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. Environment Configuration

1. **Get your Supabase credentials**:
   - Go to Project Settings → API
   - Copy your Project URL
   - Copy your anon/public key

2. **Update your `.env.local` file**:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Security Notes**:
   - The anon key is safe to use in client-side code
   - Row Level Security (RLS) policies protect your data
   - Never expose your service role key in client-side code

### 4. Testing the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test the contact form**:
   - Navigate to the contact form section
   - Fill out and submit the form
   - Check your Supabase dashboard → Table Editor → contact_submissions

3. **Verify data storage**:
   ```sql
   SELECT * FROM contact_submissions ORDER BY created_at DESC;
   ```

### 5. Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. **Add environment variables** to your hosting platform
2. **Verify RLS policies** are properly configured
3. **Test the contact form** in production
4. **Monitor submissions** through Supabase dashboard

### 6. Admin Dashboard Setup

The portfolio includes a secure admin dashboard for managing contact submissions:

1. **Admin Authentication Setup**:
   - Admin access is controlled through Supabase authentication
   - Only authenticated users can access admin routes
   - Protected by middleware and server-side authentication checks

2. **Admin User Creation**:
   ```sql
   -- Create admin user in Supabase Auth
   -- Go to Authentication → Users in Supabase Dashboard
   -- Click "Add User" and create admin account with:
   -- Email: your_admin_email@gmail.com
   -- Password: Strong password
   -- Email Confirm: true
   ```

3. **Admin Routes**:
   - `/admin/login` - Admin login page
   - `/admin/dashboard` - Overview with statistics
   - `/admin/contacts` - Contact submissions management

4. **Admin Features**:
   - **Dashboard Statistics**: Total submissions, daily/weekly/monthly counts
   - **Contact Management**: View, search, and manage all contact submissions
   - **Responsive Design**: Mobile-friendly admin interface
   - **Secure Authentication**: Protected routes with automatic redirects

### Database Schema

The contact form uses this simple schema:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | TEXT | Sender's name |
| `email` | TEXT | Sender's email |
| `subject` | TEXT | Message subject |
| `message` | TEXT | Message content |
| `created_at` | TIMESTAMP | Submission timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## 📧 Email Notification System

The contact form includes a comprehensive dual email notification system that sends professional HTML emails to both the admin and the user.

### Email Configuration

1. **Gmail Setup**:
   - Use a Gmail account for sending emails
   - Enable 2-Factor Authentication on your Gmail account
   - Generate an App Password: [Gmail App Passwords Guide](https://support.google.com/accounts/answer/185833)

2. **Environment Variables**:
   ```env
   # Email Configuration (Gmail SMTP)
   GMAIL_USER="your_gmail_address@gmail.com"
   GMAIL_PASS="your_gmail_app_password"
   ADMIN_EMAIL="your_admin_email@gmail.com"
   ```

### Email Features

#### **Dual Email System**
When a user submits the contact form, two emails are automatically sent:

1. **Admin Notification Email**:
   - Sent to `ADMIN_EMAIL`
   - Contains all form submission details
   - Professional SAAD portfolio branding
   - Includes timestamp and formatted message
   - Reply-to set to user's email for easy response

2. **User Confirmation Email**:
   - Sent to the user's email address
   - Confirms message was received successfully
   - Includes response time expectations
   - Links to social media and portfolio
   - Professional and welcoming tone

#### **Email Templates**
- **Responsive HTML Design**: Works on all email clients
- **Dark Theme Styling**: Matches webapp's dark theme color palette
- **SAAD Portfolio Branding**: Consistent with website design
- **Professional Styling**: Uses exact OKLCH colors from globals.css
- **Mobile-Friendly**: Optimized for mobile email clients
- **Accessibility**: Proper contrast and readable fonts

#### **Error Handling**
- **Graceful Degradation**: Form works even if email fails
- **Comprehensive Logging**: Detailed error logs for debugging
- **Partial Success**: Continues if one email fails
- **User Feedback**: Clear success/error messages

### Email Service Architecture

```
Contact Form Submission
         ↓
    API Route (/api/contact)
         ↓
    Database Storage (Supabase)
         ↓
    Email Service (Nodemailer + Gmail SMTP)
         ↓
    ┌─────────────────┬─────────────────┐
    ↓                 ↓                 ↓
Admin Email      User Email       Success Response
```

### Testing Email Functionality

1. **Development Testing**:
   ```bash
   npm run dev
   ```

2. **Submit Test Form**:
   - Fill out the contact form
   - Check server logs for email status
   - Verify emails in both admin and user inboxes

3. **Production Deployment**:
   - Add email environment variables to hosting platform
   - Test with real email addresses
   - Monitor email delivery logs

### Email Security

- **App Passwords**: Uses Gmail App Passwords (not account password)
- **Environment Variables**: Sensitive credentials stored securely
- **Server-Side Only**: Email credentials never exposed to client
- **TLS Encryption**: All email communication encrypted
- **Rate Limiting**: Protected by Next.js API rate limiting

## 🔐 Admin Dashboard System

The portfolio includes a comprehensive admin dashboard for managing contact submissions and monitoring portfolio activity.

### Admin Features

#### **🔒 Secure Authentication**
- **Supabase Auth Integration**: Uses Supabase authentication for secure admin access
- **Protected Routes**: All admin routes protected by middleware
- **Session Management**: Automatic session handling and renewal
- **Secure Logout**: Complete session cleanup on logout

#### **📊 Dashboard Overview**
- **Real-time Statistics**: Live contact submission counts
- **Time-based Analytics**: Daily, weekly, and monthly submission metrics
- **Recent Activity**: Latest contact submissions with quick preview
- **Visual Cards**: Clean, card-based interface with icons and metrics

#### **📋 Contact Management**
- **Submission Listing**: Paginated view of all contact submissions
- **Search & Filter**: Find specific submissions quickly
- **Export Functionality**: Export submissions as CSV, JSON, or HTML
- **Read Status Tracking**: Mark submissions as read/unread
- **Detailed View**: Full submission details with timestamp
- **Responsive Design**: Mobile-friendly admin interface

#### **🎨 Admin UI Design**
- **Consistent Branding**: Matches main portfolio design system
- **Dark Theme**: Professional dark interface
- **Liquid Glass Navigation**: Same advanced navigation effects
- **Mobile Optimized**: Touch-friendly admin interface

### Admin Routes

| Route | Description | Access Level |
|-------|-------------|--------------|
| `/admin/login` | Admin login page | Public |
| `/admin/dashboard` | Main dashboard with statistics | Authenticated |
| `/admin/contacts` | Contact submissions management | Authenticated |

### Admin Setup Guide

1. **Create Admin User**:
   ```bash
   # Go to your Supabase Dashboard
   # Navigate to Authentication → Users
   # Click "Add User" and create admin account
   ```

2. **Admin Credentials**:
   - Use a secure email address
   - Set a strong password
   - Confirm email verification

3. **Access Admin Panel**:
   ```
   https://your-domain.com/admin/login
   ```

4. **Security Features**:
   - Automatic redirect to login if not authenticated
   - Session timeout handling
   - Secure password requirements
   - Protected API endpoints

### Admin Security

- **Route Protection**: Middleware-level authentication checks
- **Server-Side Validation**: All admin actions validated server-side
- **Session Security**: Secure session management with Supabase
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Environment Isolation**: Admin credentials separate from client code

## ✅ Implemented Features

### 🎯 Core Functionality
- ✅ **Responsive Navigation**: Desktop and mobile navigation with smooth scrolling
- ✅ **Hero Section**: Interactive hero with 3D background and call-to-action
- ✅ **About Section**: Personal background, education, and approach
- ✅ **Projects Section**: Portfolio showcase with technology tags and status
- ✅ **Skills Section**: Comprehensive technical skills by category
- ✅ **Contact Section**: Multiple contact methods and social media links
- ✅ **Contact Form**: Functional form with Supabase backend and dual email notifications
- ✅ **Footer**: Professional footer with navigation and social links

### 🎨 Design System
- ✅ **Liquid Glass Effects**: Advanced glassmorphism with realistic depth
- ✅ **Reveal Card System**: Microsoft Fluent Design-inspired interactions
- ✅ **Dark Theme**: Carefully crafted dark color palette
- ✅ **Typography**: Professional font stack with Doto and Besley
- ✅ **Animations**: Smooth transitions and micro-interactions
- ✅ **Mobile Optimization**: Touch-friendly interactions and layouts

### 🔧 Technical Implementation
- ✅ **Next.js 15**: Latest framework with App Router
- ✅ **React 19**: Modern React with latest features
- ✅ **TypeScript**: Full type safety throughout
- ✅ **Tailwind CSS v4**: Latest styling framework
- ✅ **shadcn/ui**: Modern UI component library
- ✅ **Backend Integration**: Supabase database with Row Level Security
- ✅ **Email Notifications**: Dual email system (admin alerts + user confirmations)
- ✅ **Form Handling**: Real-time validation, database storage, and email delivery
- ✅ **Admin Dashboard**: Secure admin panel with authentication and contact management
- ✅ **Performance**: Optimized animations and responsive design

## 📁 Project Structure

```
portfolio/
├── app/
│   ├── admin/              # Admin dashboard routes
│   │   ├── contacts/
│   │   │   └── page.tsx    # Contact submissions management
│   │   ├── dashboard/
│   │   │   └── page.tsx    # Admin dashboard with statistics
│   │   ├── login/
│   │   │   └── page.tsx    # Admin login page
│   │   └── layout.tsx      # Admin layout with navigation
│   ├── api/
│   │   └── contact/
│   │       └── route.ts    # Contact form API endpoint
│   ├── globals.css         # Global styles, animations, and Tailwind configuration
│   ├── layout.tsx          # Root layout with metadata
│   └── page.tsx            # Main portfolio page
├── components/
│   ├── admin/              # Admin dashboard components
│   │   ├── admin-navigation.tsx # Admin navigation bar
│   │   ├── dashboard-stats.tsx  # Dashboard statistics cards
│   │   └── contact-table.tsx    # Contact submissions table
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── sheet.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── label.tsx
│   │   └── form.tsx
│   ├── navigation.tsx      # Main navigation component
│   ├── hero-section.tsx    # Hero section with CTA and 3D background
│   ├── about-section.tsx   # About section component
│   ├── projects-section.tsx # Projects showcase component
│   ├── skills-section.tsx  # Skills and expertise component
│   ├── contact-section.tsx # Contact information component
│   ├── contact-form-section.tsx # Contact form with Supabase integration
│   ├── footer-section.tsx  # Footer with navigation and social links
│   ├── animations.tsx      # Animation components and utilities
│   └── reveal-card.tsx     # Fluent Design reveal effect component
├── lib/
│   ├── auth/               # Authentication utilities
│   │   ├── admin.ts        # Admin authentication functions
│   │   └── middleware.ts   # Auth middleware utilities
│   ├── supabase/           # Supabase configuration
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   ├── admin.ts        # Admin client (service role)
│   │   └── middleware.ts   # Middleware utilities
│   ├── services/           # Business logic services
│   │   ├── contact.ts      # Contact form service
│   │   ├── email.ts        # Email notification service
│   │   └── admin.ts        # Admin dashboard services
│   ├── types/              # TypeScript type definitions
│   │   └── database.ts     # Database types
│   └── utils.ts            # Utility functions (cn helper)
├── middleware.ts           # Next.js middleware for Supabase
├── .env.local.example      # Environment variables example
├── components.json         # shadcn/ui configuration
└── package.json
```

## 🎨 Design System

### Color Palette
- **Background**: Light/Dark adaptive background
- **Foreground**: High contrast text colors
- **Primary**: Brand accent color for CTAs
- **Secondary**: Subtle accent for secondary actions
- **Muted**: Subdued colors for less important content

### Typography Scale
- **Hero Heading**: 4xl → 8xl (responsive)
- **Section Headings**: 3xl → 5xl (responsive)
- **Body Text**: lg → xl (responsive)
- **Navigation**: sm → lg (responsive)

### Spacing System
- **Mobile Padding**: 2rem minimum
- **Desktop Padding**: 4rem minimum
- **Section Spacing**: 5rem → 8rem vertical
- **Component Gaps**: 1rem → 1.5rem

## 🎨 Advanced Features

### Liquid Glass Navigation
- **Three-Layer Architecture**: Bend, Face, and Edge layers for realistic glass effect
- **SVG Filters**: feTurbulence and feDisplacementMap for authentic distortion
- **Responsive Design**: Optimized for both desktop and mobile interactions
- **Dark Mode Support**: Adaptive glass effects for light and dark themes

### Fluent Design Reveal Effects
- **Mouse Tracking**: Real-time cursor position tracking for spotlight effects
- **Mobile Touch Support**: Touch-optimized reveal effects for mobile devices
- **Performance Optimized**: Hardware-accelerated animations with will-change
- **Accessibility**: Focus-visible states for keyboard navigation

### Contact Form System
- **Real-time Validation**: Client-side validation with TypeScript
- **Loading States**: Visual feedback during form submission
- **Success/Error Handling**: User-friendly feedback messages
- **Form Reset**: Automatic form clearing after successful submission

### Animation System
- **GSAP-style Easing**: Custom cubic-bezier timing functions
- **Staggered Animations**: Sequential reveal animations with delays
- **Scroll-triggered**: Intersection Observer for performance
- **Mobile Optimized**: Reduced motion support for accessibility

## 🔧 Customization

### Adding New Sections
1. Create section component in `components/`
2. Import and add to `app/page.tsx`
3. Update navigation items in `components/navigation.tsx`
4. Add to footer navigation if needed

### Styling Modifications
- **Global Styles**: Edit `app/globals.css`
- **Component Styles**: Use Tailwind classes in components
- **Theme Colors**: Modify CSS custom properties in `globals.css`
- **Animations**: Customize timing and easing in `globals.css`

### Adding shadcn/ui Components
```bash
npx shadcn@latest add [component-name]
```

## 📱 Responsive Behavior

### Mobile (< 768px)
- Hamburger menu navigation
- Stacked layout
- Touch-optimized button sizes
- Reduced font sizes and spacing

### Tablet (768px - 1024px)
- Transitional layout
- Moderate font scaling
- Balanced spacing

### Desktop (> 1024px)
- Full horizontal navigation
- Maximum font sizes
- Generous spacing and padding

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically on push

### Other Platforms
```bash
npm run build
npm start
```

## 🔮 Future Enhancements

### Planned Features
- **Blog Integration**: Blog section with CMS integration
- **Project Filtering**: Dynamic project cards with technology filtering
- **Email Integration**: Backend email service for contact form
- **Analytics Dashboard**: Personal analytics for portfolio visits
- **SEO Optimization**: Enhanced metadata and structured data
- **Content Management**: Headless CMS for easy content updates

### Technical Improvements
- **Performance**: Image optimization and lazy loading
- **Accessibility**: Enhanced ARIA labels and keyboard navigation
- **Analytics**: Google Analytics or similar tracking
- **Testing**: Unit and integration tests with Jest/Vitest
- **CI/CD**: Automated testing and deployment pipeline

## 📄 License

This project is private and proprietary to Mudabbirul Saad.

## 🤝 Contributing

This is a personal portfolio project. For suggestions or feedback, please contact Mudabbirul Saad directly.

---

**Built with ❤️ using Next.js, React, and shadcn/ui**
