import { APP_BASE_HREF } from '@angular/common';
import { LOCALE_ID, InjectionToken } from '@angular/core';
import { CommonEngine } from '@angular/ssr';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join, resolve } from 'node:path';
import express, { Request, Response } from 'express';

import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  /**
   * Get the language from the corresponding folder
   */
  const lang = basename(serverDistFolder);
  /**
   * Set the route for static content and APP_BASE_HREF
   */
  const langPath = `/${lang}/`;
  /**
   * Note that the 'browser' folder is located two directories above 'server/{lang}/'
   */
  const browserDistFolder = resolve(serverDistFolder, `../../browser/${lang}`);
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get(
    '**',
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    })
  );

  // All regular routes use the Angular engine
  const REQUEST = new InjectionToken<Request>('REQUEST');
  const RESPONSE = new InjectionToken<Response>('RESPONSE');
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: resolve(serverDistFolder, `../../browser/`), // publicPath does not need to concatenate the language
        providers: [
          { provide: APP_BASE_HREF, useValue: langPath },
          { provide: LOCALE_ID, useValue: lang },
          { provide: REQUEST, useValue: req },
          { provide: RESPONSE, useValue: res },
        ],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}
