'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageCircle,
  ListMusic,
  Heart,
  Clock,
  Disc3,
  Music2,
  Home,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { usePlayback } from '@/lib/playback-context';

const mainNavItems = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
  },
  {
    title: 'Chat',
    href: '/chat',
    icon: MessageCircle,
  },
];

const libraryNavItems = [
  {
    title: 'Playlists',
    href: '/playlists',
    icon: ListMusic,
  },
  {
    title: 'Liked Songs',
    href: '/liked-songs',
    icon: Heart,
  },
  {
    title: 'Recently Played',
    href: '/recently-played',
    icon: Clock,
  },
  {
    title: 'Albums',
    href: '/albums',
    icon: Disc3,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentTrack, isPlaying } = usePlayback();

  return (
    <Sidebar className="border-r border-white/10">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Music2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Moodify
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Your Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {libraryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {currentTrack && (
          <div className="p-3 bg-white/5 rounded-lg mx-2 mb-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded bg-white/10 flex items-center justify-center">
                  <Music2 className="h-5 w-5 text-white/50" />
                </div>
                {isPlaying && (
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentTrack.name}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {currentTrack.artists}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
