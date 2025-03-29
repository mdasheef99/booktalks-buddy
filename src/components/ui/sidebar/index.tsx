
import { TooltipProvider } from "@/components/ui/tooltip"
import React from "react"
import { SidebarProvider, useSidebar } from "./sidebar-context"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarWrapper 
} from "./sidebar-layout"
import { 
  SidebarGroup, 
  SidebarGroupAction, 
  SidebarGroupContent, 
  SidebarGroupLabel 
} from "./sidebar-group"
import { 
  SidebarMenu, 
  SidebarMenuAction, 
  SidebarMenuBadge, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarMenuSkeleton 
} from "./sidebar-menu"
import { 
  SidebarMenuSub, 
  SidebarMenuSubButton, 
  SidebarMenuSubItem 
} from "./sidebar-submenu"
import { 
  SidebarInset, 
  SidebarInput, 
  SidebarRail, 
  SidebarSeparator, 
  SidebarTrigger 
} from "./sidebar-utils"

// Export top-level components and context hook
export { useSidebar, SidebarProvider, TooltipProvider }

// Export all sidebar components
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarWrapper
}
