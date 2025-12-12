// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import { View } from '../../types';
import { describe, it, expect, vi } from 'vitest';

// Mock Lucide icons to avoid rendering issues
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <div data-testid="icon-dashboard" />,
  FileText: () => <div data-testid="icon-filetext" />,
  ShoppingBag: () => <div data-testid="icon-shoppingbag" />,
  Settings: () => <div data-testid="icon-settings" />,
  BookOpen: () => <div data-testid="icon-bookopen" />,
  Library: () => <div data-testid="icon-library" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  BarChart2: () => <div data-testid="icon-barchart2" />,
  Users: () => <div data-testid="icon-users" />,
  GraduationCap: () => <div data-testid="icon-graduationcap" />,
  ChevronRight: () => <div data-testid="icon-chevronright" />,
  Layers: () => <div data-testid="icon-layers" />,
  PenTool: () => <div data-testid="icon-pentool" />,
  CreditCard: () => <div data-testid="icon-creditcard" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  HelpCircle: () => <div data-testid="icon-helpcircle" />,
  X: () => <div data-testid="icon-x" />,
  Search: () => <div data-testid="icon-search" />,
  ChevronDown: () => <div data-testid="icon-chevrondown" />,
  PlusCircle: () => <div data-testid="icon-pluscircle" />,
  LogOut: () => <div data-testid="icon-logout" />,
  Sun: () => <div data-testid="icon-sun" />,
  Moon: () => <div data-testid="icon-moon" />,
  Briefcase: () => <div data-testid="icon-briefcase" />,
  Target: () => <div data-testid="icon-target" />,
  BrainCircuit: () => <div data-testid="icon-braincircuit" />,
}));

describe('Sidebar', () => {
  it('correctly expands groups on search without infinite loops', async () => {
    const onChangeView = vi.fn();
    const onClose = vi.fn();

    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Render the Sidebar
    const { getByPlaceholderText, getByText } = render(
      <Sidebar
        currentView={View.DASHBOARD}
        onChangeView={onChangeView}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Get search input
    const searchInput = getByPlaceholderText('Jump to...');

    // Trigger the bug/feature
    fireEvent.change(searchInput, { target: { value: 'Scholar' } });

    // Check if BUG log is NOT triggered
    expect(consoleSpy).not.toHaveBeenCalledWith("BUG_DETECTED: State update during render");

    // Check if the item is visible (meaning group was expanded)
    // We expect "Scholar Toolkit" to be visible
    await waitFor(() => {
        expect(screen.getByText('Scholar Toolkit')).toBeDefined();
    });

    consoleSpy.mockRestore();
  });
});
