import type { FileInfo, API, Options, Program } from 'jscodeshift';

import {
  hasImportDeclaration,
  convertDefaultImportToNamedImport,
  addCommentForUnresolvedImportSpecifiers,
  withPlugin,
  applyVisitor,
} from '../../codemods-helpers';
import type { CodemodPluginInstance } from '../../plugins/types';
import defaultCodemodPlugin from '../../plugins/default';

const imports = {
  compiledStyledImportName: 'styled',
  styledComponentsPackageName: 'styled-components',
};

const transformer = (fileInfo: FileInfo, api: API, options: Options): string => {
  const { source } = fileInfo;
  const { jscodeshift: j } = api;
  const collection = j(source);
  const plugins: Array<CodemodPluginInstance> = [
    defaultCodemodPlugin,
    ...options.normalizedPlugins,
  ].map((plugin) => plugin.create(fileInfo, api, options));

  const originalProgram: Program = j(source).find(j.Program).get();

  const hasStyledComponentsImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.styledComponentsPackageName,
  });

  if (!hasStyledComponentsImportDeclaration) {
    return source;
  }

  addCommentForUnresolvedImportSpecifiers({
    j,
    collection,
    importPath: imports.styledComponentsPackageName,
    allowedImportSpecifierNames: [],
  });

  convertDefaultImportToNamedImport({
    j,
    plugins,
    collection,
    importPath: imports.styledComponentsPackageName,
    namedImport: imports.compiledStyledImportName,
  });

  applyVisitor({
    plugins,
    originalProgram,
    currentProgram: collection.find(j.Program).get(),
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);