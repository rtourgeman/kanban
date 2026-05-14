import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the Hebrew RTL shell', async () => {
    render(<App />);

    expect(await screen.findByText('בקרת ליקויי בניה')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
});
