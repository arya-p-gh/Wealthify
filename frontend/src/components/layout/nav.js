import { LayoutGrid, BriefcaseBusiness, LineChart, Star, Target, Calculator } from 'lucide-react';

export const NAV = [
  { to: '/dashboard', label: 'Home', icon: LayoutGrid },
  { to: '/portfolio', label: 'Portfolio', icon: BriefcaseBusiness },
  { to: '/markets', label: 'Markets', icon: LineChart },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/calculators', label: 'Calculators', icon: Calculator },
];
