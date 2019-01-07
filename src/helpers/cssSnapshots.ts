import { extractICSS, IICSSExports } from 'icss-utils';
import * as postcss from 'postcss';
import * as postcssIcssSelectors from 'postcss-icss-selectors';
import * as postcssNested from 'postcss-nested';
import * as strip from 'strip-css-singleline-comments/sync';
import * as ts_module from 'typescript/lib/tsserverlibrary';
import { transformClasses } from './classTransforms';

const processor = postcss(
  postcssNested,
  postcssIcssSelectors({ mode: 'local' }),
);

export const getClasses = (css: string) => {
  try {
    const cleanCss = strip(css);
    const processedCss = processor.process(cleanCss);
    return extractICSS(processedCss.root).icssExports;
  } catch (e) {
    return {};
  }
};
const classNameToProperty = (className: string) => `'${className}': string;`;
const flattenClassNames = (
  previousValue: string[] = [],
  currentValue: string[],
) => previousValue.concat(currentValue);

export const createExports = (classes: IICSSExports, options: IOptions) => `\
declare const classes: {
  ${Object.keys(classes)
    .map(transformClasses(options.camelCase))
    .reduce(flattenClassNames, [])
    .map(classNameToProperty)
    .join('\n  ')}
};
export default classes;
`;

export const getDtsSnapshot = (
  ts: typeof ts_module,
  scriptSnapshot: ts.IScriptSnapshot,
  options: IOptions,
) => {
  const css = scriptSnapshot.getText(0, scriptSnapshot.getLength());
  const classes = getClasses(css);
  const dts = createExports(classes, options);
  return ts.ScriptSnapshot.fromString(dts);
};
