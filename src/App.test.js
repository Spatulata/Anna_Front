import { render, screen } from '@testing-library/react';
import App from './App';

test('shows login page for anonymous user', () => {
  render(<App />);
  const title = screen.getByText(/Вход в систему/i);
  expect(title).toBeInTheDocument();
});
