import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DefectForm } from './DefectForm';

describe('DefectForm', () => {
  it('saves a title-only defect with default status and severity', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<DefectForm onSave={onSave} />);

    await user.type(screen.getByLabelText('כותרת ליקוי'), 'רטיבות ליד חלון');
    await user.click(screen.getByRole('button', { name: 'שמור ליקוי' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'רטיבות ליד חלון',
        status: 'open',
        severity: 'medium',
        photos: []
      })
    );
  });
});
