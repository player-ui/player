import { renderHook } from '@testing-library/react-hooks';
import { useWebPlayer } from '..';

test('webplayer hook', () => {
  const { result } = renderHook(() => useWebPlayer());
  expect(result.current.webPlayer).toBeDefined();
});
