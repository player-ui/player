import { Player, PlayerPlugin } from "@player-ui/player";

export default class FancyPlugin implements PlayerPlugin {
  name = 'fancy-plugin';
  private isFancy: boolean = true;

  constructor(isFancy: boolean = true) {
    this.isFancy = isFancy;
  }

  apply(player: Player): void {
    // This method is called when the plugin is applied to the player instance
    console.log(`Applying ${this.name} to player instance`);
  }
}