/**
 * Testimonial Stats Component
 * Display statistics about testimonials
 */

import React from 'react';
import type { TestimonialStatsProps } from '../types/testimonialTypes';
import { calculateTestimonialStats } from '../utils/testimonialUtils';
import { UI_TEXT } from '../constants/testimonialConstants';

export const TestimonialStats: React.FC<TestimonialStatsProps> = ({ testimonials }) => {
  const stats = calculateTestimonialStats(testimonials);

  return (
    <div className="text-sm text-gray-600">
      {UI_TEXT.STATS.APPROVED_PENDING(stats.approved, stats.pending)}
    </div>
  );
};

/**
 * Detailed Testimonial Stats Component
 * More comprehensive statistics display
 */
export const DetailedTestimonialStats: React.FC<TestimonialStatsProps> = ({ testimonials }) => {
  const stats = calculateTestimonialStats(testimonials);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
        <div className="text-sm text-gray-600">Approved</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        <div className="text-sm text-gray-600">Pending</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.featured}</div>
        <div className="text-sm text-gray-600">Featured</div>
      </div>
    </div>
  );
};

/**
 * Compact Stats Component
 * Minimal statistics display
 */
export const CompactTestimonialStats: React.FC<TestimonialStatsProps> = ({ testimonials }) => {
  const stats = calculateTestimonialStats(testimonials);

  return (
    <div className="flex items-center space-x-4 text-xs text-gray-500">
      <span>{stats.total} total</span>
      <span className="text-green-600">{stats.approved} approved</span>
      {stats.pending > 0 && (
        <span className="text-yellow-600">{stats.pending} pending</span>
      )}
      {stats.featured > 0 && (
        <span className="text-purple-600">{stats.featured} featured</span>
      )}
    </div>
  );
};
