
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

/**
 * Combined sidebar provider with tooltip provider
 */
const CombinedSidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SidebarProvider>
>(({ children, ...props }, ref) => {
  return (
    <SidebarProvider ref={ref} {...props}>
      <TooltipProvider delayDuration={0}>
        <SidebarWrapper>{children}</SidebarWrapper>
      </TooltipProvider>
    </SidebarProvider>
  )
})
CombinedSidebarProvider.displayName = "CombinedSidebarProvider"

// Export top-level component and context hook
export { useSidebar, CombinedSidebarProvider as SidebarProvider }

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
}
