import { useState } from 'react';

export const useVendorFormState = () => {
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  return { formLoading, setFormLoading, formError, setFormError };
};
