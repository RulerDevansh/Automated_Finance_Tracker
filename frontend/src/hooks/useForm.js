import { useState } from 'react';

export const useForm = (initial = {}) => {
  const [values, setValues] = useState(initial);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const reset = () => setValues(initial);

  return { values, onChange, reset, setValues };
};
