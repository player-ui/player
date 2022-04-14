// import { PlayerLanguageService } from '@player-ui/service';
import type { DSLCompiler } from '@player-ui/dsl';

export interface PlayerCLIPlugin {
  // /**
  //  * Handler when an LSP instance is created
  //  * Use this to add custom rule-sets, load asset types, etc
  //  */
  // onCreateLanguageService?: (
  //   lsp: PlayerLanguageService
  // ) => void | Promise<void>;

  /**
   * Handler when a DSL compiler is created
   * Use this to change how content is generated
   */
  onCreateDSLCompiler?: (compiler: DSLCompiler) => void | Promise<void>;
}

export type PlayerCLIClass = {
  new (): PlayerCLIPlugin;
};
