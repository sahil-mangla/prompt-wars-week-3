import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileModal } from './ProfileModal';

describe('ProfileModal Component', () => {
  const profileMock = {
    language: 'en',
    city: 'Mumbai',
    housingType: 'Apartment Renter',
    diet: 'mixed' as const,
  };

  const languagesMock = {
    en: 'English',
    es: 'Spanish',
  };

  it('renders fields with initial profile values and triggers onSave with modified inputs', async () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ProfileModal
        profile={profileMock}
        languages={languagesMock}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    expect(screen.getByText('Your Profile')).toBeInTheDocument();
    
    const langSelect = screen.getByLabelText(/Language preference/i);
    expect(langSelect).toHaveValue('en');
    fireEvent.change(langSelect, { target: { value: 'es' } });

    const dietSelect = screen.getByLabelText(/Diet preference/i);
    expect(dietSelect).toHaveValue('mixed');
    fireEvent.change(dietSelect, { target: { value: 'vegan' } });

    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith({
        language: 'es',
        city: 'Mumbai',
        housingType: 'Apartment Renter',
        diet: 'vegan',
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <ProfileModal
        profile={profileMock}
        languages={languagesMock}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    const closeButton = screen.getByRole('button', { name: /Close profile settings/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });
});
