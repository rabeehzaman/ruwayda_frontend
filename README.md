# Ghadeer Al Sharq Trading EST - Business Analytics Dashboard

A comprehensive dashboard for profit analysis and business insights built with Next.js, Supabase, and shadcn/ui.

## Features

- 📊 Real-time profit analysis dashboard
- 📈 Interactive charts and visualizations
- 💰 Key Performance Indicators (KPIs)
- 📋 Detailed data tables
- 🎨 Modern UI with shadcn/ui components
- 📱 Responsive design
- 🌙 Dark/Light mode support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase
- **UI Components**: shadcn/ui v4
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
- **Deployment**: Railway (Production optimized)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MadaDashboardV10
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application expects a Supabase view named `profit_analysis_view_current` with the following structure:

- `id` - Unique identifier
- `created_at` - Timestamp
- `period_start` - Period start date
- `period_end` - Period end date
- `total_revenue` - Total revenue amount
- `net_profit` - Net profit amount
- `gross_profit` - Gross profit amount
- `net_margin` - Net profit margin percentage
- `revenue_growth` - Revenue growth percentage
- `customer_count` - Number of customers
- `average_order_value` - Average order value
- `product_category` - Product category
- `region` - Geographic region

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

### Environment Variables for Production

Make sure to set the following environment variables in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── dashboard/         # Dashboard components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features Breakdown

### Dashboard Components
- **KPI Cards**: Display key metrics with trend indicators
- **Charts**: Revenue, profit, and margin visualizations
- **Data Tables**: Detailed profit analysis data
- **Sidebar Navigation**: Easy access to different sections

### Data Management
- **Supabase Integration**: Real-time data from profit_analysis_view_current
- **Mock Data Fallback**: Development mode with sample data
- **Type Safety**: Full TypeScript support

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
