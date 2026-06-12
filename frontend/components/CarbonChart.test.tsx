import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CarbonChart } from './CarbonChart';

describe('CarbonChart Component', () => {
  it('renders correctly with given weekly data', () => {
    const weeklyData = [1.2, 0.8, 2.5, 0.0, 3.0, 1.5, 2.0];
    render(<CarbonChart weeklyData={weeklyData} />);
    
    const svgEl = screen.getByRole('img', { name: /Weekly CO₂ savings chart/i });
    expect(svgEl).toBeInTheDocument();

    const path = svgEl.querySelector('path');
    const polyline = svgEl.querySelector('polyline');
    
    expect(path).toBeInTheDocument();
    expect(polyline).toBeInTheDocument();
  });
});
