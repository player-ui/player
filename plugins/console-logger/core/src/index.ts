import type { Player, PlayerPlugin, Severity } from "@player-ui/player";
import { ConsoleLogger } from "@player-ui/player";

/**
 * The ConsoleLogger plugin is an easy way to debug Player locally by sending all log events to the js console
 */
export class ConsoleLoggerPlugin implements PlayerPlugin {
  name = "console-logger";

  private consoleLogger: ConsoleLogger;

  constructor(severity?: Severity) {
    this.consoleLogger = new ConsoleLogger(severity);
  }

  apply(player: Player) {
    player.logger.addHandler(this.consoleLogger);
  }

  public setSeverity(severity: Severity) {
    this.consoleLogger.setSeverity(severity);
  }
}
