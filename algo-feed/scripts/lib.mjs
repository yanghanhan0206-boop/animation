// Shared helpers for the render / QA scripts: one bundle, one browser.
import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const COMPOSITION = 'AlgoFeed';
export const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

export const parseArgs = (argv = process.argv.slice(2)) =>
  Object.fromEntries(
    argv.map((a) => {
      const [k, ...v] = a.replace(/^--/, '').split('=');
      return [k, v.length ? v.join('=') : true];
    }),
  );

export const setup = async (inputProps = {}) => {
  const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.ts'), onProgress: () => undefined});
  const browser = await openBrowser('chrome', {browserExecutable});
  const composition = await selectComposition({serveUrl, id: COMPOSITION, inputProps, puppeteerInstance: browser, browserExecutable});
  return {serveUrl, browser, composition};
};
