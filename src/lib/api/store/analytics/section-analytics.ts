/**
 * Section Analytics Module
 * 
 * Handles section-specific analytics and breakdowns
 */

import { supabase } from '@/lib/supabase';
import type { SectionAnalytics, AnalyticsEvent } from './types';

/**
 * Get section-specific analytics breakdown
 */
export async function getSectionAnalytics(storeId: string, days: number = 30): Promise<SectionAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('store_landing_analytics')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', startDate.toISOString())
      .not('section_name', 'is', null);

    if (error) throw error;

    const analytics = data || [];
    const sectionMap = new Map<string, any>();

    // Group by section
    analytics.forEach((event: AnalyticsEvent) => {
      const section = event.section_name;
      if (!section) return;

      if (!sectionMap.has(section)) {
        sectionMap.set(section, {
          sectionName: section,
          totalViews: 0,
          uniqueVisitors: new Set(),
          interactions: [],
          elements: new Map()
        });
      }

      const sectionData = sectionMap.get(section);

      if (event.event_type.includes('view')) {
        sectionData.totalViews++;
      }

      if (event.session_id) {
        sectionData.uniqueVisitors.add(event.session_id);
      }

      if (event.event_type.includes('click')) {
        sectionData.interactions.push(event);
      }

      // Track element performance
      if (event.element_id && event.element_type) {
        const elementKey = `${event.element_id}-${event.element_type}`;
        const elementData = sectionData.elements.get(elementKey) || {
          elementId: event.element_id,
          elementType: event.element_type,
          interactions: 0
        };
        elementData.interactions++;
        sectionData.elements.set(elementKey, elementData);
      }
    });

    // Convert to final format
    return Array.from(sectionMap.values()).map(section => ({
      sectionName: section.sectionName,
      totalViews: section.totalViews,
      uniqueVisitors: section.uniqueVisitors.size,
      averageTimeSpent: 0, // Simplified for basic implementation
      interactionRate: section.totalViews > 0 ? (section.interactions.length / section.totalViews) * 100 : 0,
      topElements: Array.from(section.elements.values())
        .sort((a: any, b: any) => b.interactions - a.interactions)
        .slice(0, 3)
    }));
  } catch (error) {
    console.error('Error fetching section analytics:', error);
    return [];
  }
}

/**
 * Get analytics for a specific section
 */
export async function getSectionAnalyticsById(
  storeId: string, 
  sectionName: string, 
  days: number = 30
): Promise<SectionAnalytics | null> {
  try {
    const sections = await getSectionAnalytics(storeId, days);
    return sections.find(section => section.sectionName === sectionName) || null;
  } catch (error) {
    console.error('Error fetching section analytics by ID:', error);
    return null;
  }
}

/**
 * Get top performing sections
 */
export async function getTopSections(
  storeId: string, 
  days: number = 30, 
  metric: 'views' | 'interactions' | 'engagement' = 'views'
): Promise<SectionAnalytics[]> {
  try {
    const sections = await getSectionAnalytics(storeId, days);
    
    return sections.sort((a, b) => {
      switch (metric) {
        case 'views':
          return b.totalViews - a.totalViews;
        case 'interactions':
          return (b.topElements?.length || 0) - (a.topElements?.length || 0);
        case 'engagement':
          return b.interactionRate - a.interactionRate;
        default:
          return b.totalViews - a.totalViews;
      }
    }).slice(0, 5);
  } catch (error) {
    console.error('Error getting top sections:', error);
    return [];
  }
}

/**
 * Get section performance comparison
 */
export async function getSectionComparison(
  storeId: string, 
  days: number = 30
): Promise<{
  sections: SectionAnalytics[];
  totalViews: number;
  averageInteractionRate: number;
  topSection: string;
  leastEngaged: string;
}> {
  try {
    const sections = await getSectionAnalytics(storeId, days);
    
    const totalViews = sections.reduce((sum, section) => sum + section.totalViews, 0);
    const averageInteractionRate = sections.length > 0 ? 
      sections.reduce((sum, section) => sum + section.interactionRate, 0) / sections.length : 0;
    
    const topSection = sections.reduce((prev, current) => 
      current.totalViews > prev.totalViews ? current : prev, sections[0] || { sectionName: 'None', totalViews: 0 }
    );
    
    const leastEngaged = sections.reduce((prev, current) => 
      current.interactionRate < prev.interactionRate ? current : prev, sections[0] || { sectionName: 'None', interactionRate: 0 }
    );

    return {
      sections,
      totalViews,
      averageInteractionRate: Math.round(averageInteractionRate * 100) / 100,
      topSection: topSection.sectionName,
      leastEngaged: leastEngaged.sectionName
    };
  } catch (error) {
    console.error('Error getting section comparison:', error);
    return {
      sections: [],
      totalViews: 0,
      averageInteractionRate: 0,
      topSection: 'None',
      leastEngaged: 'None'
    };
  }
}

/**
 * Get element performance within sections
 */
export async function getElementPerformance(
  storeId: string, 
  sectionName: string, 
  days: number = 30
): Promise<Array<{
  elementId: string;
  elementType: string;
  interactions: number;
  conversionRate: number;
}>> {
  try {
    const section = await getSectionAnalyticsById(storeId, sectionName, days);
    if (!section || !section.topElements) return [];

    return section.topElements.map(element => ({
      elementId: element.elementId,
      elementType: element.elementType,
      interactions: element.interactions,
      conversionRate: section.totalViews > 0 ? 
        Math.round((element.interactions / section.totalViews) * 100) : 0
    }));
  } catch (error) {
    console.error('Error getting element performance:', error);
    return [];
  }
}

/**
 * Get section trends over time
 */
export async function getSectionTrends(
  storeId: string, 
  sectionName: string, 
  days: number = 30
): Promise<Array<{
  date: string;
  views: number;
  interactions: number;
  interactionRate: number;
}>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('store_landing_analytics')
      .select('*')
      .eq('store_id', storeId)
      .eq('section_name', sectionName)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    const analytics = data || [];
    const dailyData: Record<string, { views: number; interactions: number }> = {};

    // Group by date
    analytics.forEach((event: AnalyticsEvent) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = { views: 0, interactions: 0 };
      }

      if (event.event_type.includes('view')) {
        dailyData[date].views++;
      }
      if (event.event_type.includes('click')) {
        dailyData[date].interactions++;
      }
    });

    // Convert to trend format
    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      views: data.views,
      interactions: data.interactions,
      interactionRate: data.views > 0 ? Math.round((data.interactions / data.views) * 100) : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting section trends:', error);
    return [];
  }
}

/**
 * Get section heatmap data
 */
export async function getSectionHeatmap(
  storeId: string, 
  days: number = 30
): Promise<Array<{
  section: string;
  hour: number;
  day: number;
  activity: number;
}>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('store_landing_analytics')
      .select('section_name, timestamp')
      .eq('store_id', storeId)
      .gte('timestamp', startDate.toISOString())
      .not('section_name', 'is', null);

    if (error) throw error;

    const analytics = data || [];
    const heatmapData: Record<string, number> = {};

    // Group by section, day of week, and hour
    analytics.forEach((event: AnalyticsEvent) => {
      if (!event.section_name) return;
      
      const date = new Date(event.timestamp);
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = date.getHours();
      const key = `${event.section_name}-${day}-${hour}`;
      
      heatmapData[key] = (heatmapData[key] || 0) + 1;
    });

    // Convert to heatmap format
    return Object.entries(heatmapData).map(([key, activity]) => {
      const [section, day, hour] = key.split('-');
      return {
        section,
        day: parseInt(day),
        hour: parseInt(hour),
        activity
      };
    });
  } catch (error) {
    console.error('Error getting section heatmap:', error);
    return [];
  }
}
