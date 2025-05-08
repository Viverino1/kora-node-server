import { JSDOM } from "jsdom";
import puppeteer, { Browser, Page } from "puppeteer";

class Puppeteer {
  private static _browser: Browser | null = null;
  private static _isInitialized: boolean = false;

  static get browser(): Browser {
    if (!this._browser) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }
    return this._browser;
  }

  static async initialize(): Promise<void> {
    if (this._browser) {
      await this.close();
    }

    this._browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
    });

    if (!this._browser) {
      throw new Error("Failed to initialize Puppeteer.");
    } else {
      this._isInitialized = true;
    }
  }

  private static async _newPage(): Promise<Page> {
    if (!this._browser) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }
    const page = await this._browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1920, height: 1080 });
    return page;
  }

  public static async close(): Promise<void> {
    if (this._browser) {
      await this._browser.close();
      this._browser = null;
    }
  }

  public static async get(url: string, selectors: string | string[] = [], referer: string | null = null, scripts: string | string[] = []) {
    const page = await this._newPage();
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60000,
      referer: referer ?? undefined,
    });
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    await Promise.all(
      selectorArray.map((selector) =>
        page.waitForSelector(selector, {
          visible: false,
          timeout: 30000,
        })
      )
    );

    const scriptArray = Array.isArray(scripts) ? scripts : [scripts];
    const scriptResults = await Promise.all(
      scriptArray.map(async (script) => {
        return await page.evaluate(script);
      })
    );

    const html = await page.content();
    const dom = new JSDOM(html);
    const content = dom.window.document;
    await page.close();
    return { content, scriptResults };
  }
}

export default Puppeteer;
