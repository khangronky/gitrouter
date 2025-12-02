import {
  ChartColumnIncreasing,
  ChartLine,
  Factory,
  LifeBuoy,
  List,
  type LucideIcon,
  Settings,
} from 'lucide-react';

export interface NavLinks {
  main_navigation: {
    header: string;
    items: {
      title: string;
      url: string;
      icon: LucideIcon;
    }[];
  }[];
  help_and_support: {
    header: string;
    items: {
      title: string;
      url: string;
      icon: LucideIcon;
    }[];
  }[];
}

export const navLinks: NavLinks = {
  main_navigation: [
    {
      header: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: ChartColumnIncreasing,
        },
      ],
    },
    {
      header: 'Pull Requests',
      items: [
        {
          title: 'List',
          url: '/pull-requests',
          icon: List,
        },
      ],
    },
    {
      header: 'Rules',
      items: [
        {
          title: 'Rules Builder',
          url: '/rules-builder',
          icon: Factory,
        },
      ],
    },
    {
      header: 'Analytics',
      items: [
        {
          title: 'Trend',
          url: '/trend',
          icon: ChartColumnIncreasing,
        },
        {
          title: 'Performance',
          url: '/performance',
          icon: ChartLine,
        },
      ],
    },
  ],
  help_and_support: [
    {
      header: 'Help and Support',
      items: [
        {
          title: 'Setting',
          url: '/setting',
          icon: Settings,
        },
        {
          title: 'Support',
          url: '/support',
          icon: LifeBuoy,
        },
      ],
    },
  ],
};
