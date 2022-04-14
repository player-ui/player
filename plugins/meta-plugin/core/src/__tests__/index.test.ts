import { Player } from '@player-ui/player';
import { MetaPlugin } from '..';

test('calls apply on each plugin', () => {
  const plugins = [
    { apply: jest.fn(), name: '1' },
    { apply: jest.fn(), name: '2' },
  ];
  const player = new Player({ plugins: [new MetaPlugin(plugins)] });

  plugins.forEach((p) => expect(p.apply).toBeCalledWith(player));
});
